import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse, getUserConfigs, updateUserConfigs } from '../utils/lambdaUtils';
import { BillingCycle, toUpperCamelCase, UserStatus } from '@bpenwell/instantlyanalyze-module';
import type { IUserConfigs } from '@bpenwell/instantlyanalyze-module';
import Stripe from 'stripe';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});

// Initialize Stripe (for creating & managing subscriptions)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const handler = async (
  event: APIGatewayEvent | any,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // 1) Handle preflight OPTIONS requests
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return createResponse(200, '', true);
  }

  // 2) Handle Stripe events from EventBridge
  if (event.source?.startsWith('aws.partner/stripe.com') && event.detail) {
    const stripeEvent = event.detail;  // Full Stripe event
    const stripeEventType = stripeEvent.type;  
    console.log('Received Stripe event via EventBridge:', stripeEventType);

    try {
      switch (stripeEventType) {
        // -----------------------------------------------
        // 2a) Checkout Session Completed
        // -----------------------------------------------
        case 'checkout.session.completed': {
          const session = stripeEvent.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id;
          const subscriptionId = session.subscription as string;

          if (!userId) {
            console.error('No userId found on session');
            return createResponse(500, { message: 'Internal Server Error', error: 'No userId' }, true);
          }

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;
          // 2. Determine plan name or billing cycle
          let billingCycle = 'monthly';
          if (priceId === process.env.STRIPE_YEARLY_PRICE_ID) {
            billingCycle = 'yearly';
          }
          // Mark user as PRO
          const currentUserConfig = await getUserConfigs(ddbClient, userId);
          const updatedConfig: IUserConfigs = {
            ...currentUserConfig,
            userId,
            subscription: {
              ...currentUserConfig?.subscription,
              subscriptionId,
              status: 'pro',
              billingCycle: billingCycle,
            },
            preferences: {
              ...currentUserConfig?.preferences!,
            },
          };
          await updateUserConfigs(ddbClient, updatedConfig);
          console.log(`User ${userId} subscription activated via checkout session.`);
          break;
        }

        // -----------------------------------------------
        // 2b) Subscription Updated (e.g., cancellation pending)
        // -----------------------------------------------
        case 'customer.subscription.updated': {
          const subscription = stripeEvent.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          if (!userId) {
            console.error('Missing userId in subscription metadata.');
            break;
          }

          const currentUserConfig = await getUserConfigs(ddbClient, userId);
          const updatedConfig: IUserConfigs = {
            ...currentUserConfig,
            userId,
            subscription: {
              ...currentUserConfig?.subscription!,
              subscriptionId: subscription.id,
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end,
            },
            preferences: {
              ...currentUserConfig?.preferences!,
            },
          };
          await updateUserConfigs(ddbClient, updatedConfig);
          console.log(
            `User ${userId} subscription updated. Cancel at period end: ${subscription.cancel_at_period_end}`
          );
          break;
        }

        // -----------------------------------------------
        // 2c) Subscription Deleted (fully canceled)
        // -----------------------------------------------
        case 'customer.subscription.deleted': {
          const subscription = stripeEvent.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          if (!userId) {
            console.error('Missing userId in subscription metadata.');
            break;
          }

          const currentUserConfig = await getUserConfigs(ddbClient, userId);
          const updatedConfig: IUserConfigs = {
            userId,
            preferences: {
              ...currentUserConfig?.preferences!,
            },
            subscription: {
              ...currentUserConfig?.subscription!,
              status: 'free',
              subscriptionId: subscription.id,
              current_period_end: undefined,
              cancel_at_period_end: false,
            },
          };
          await updateUserConfigs(ddbClient, updatedConfig);
          console.log(`User ${userId} subscription fully cancelled.`);
          break;
        }

        // -----------------------------------------------
        // 2d) Unhandled
        // -----------------------------------------------
        default:
          console.log(`Unhandled Stripe event type: ${stripeEventType}`);
          break;
      }
    } catch (error: any) {
      console.error('Error processing Stripe event:', error.message);
      return createResponse(500, { message: 'Internal Server Error', error: error.message }, true);
    }

    return createResponse(200, { received: true }, true);
  }

  // 3) Handle createCheckoutSession calls (from your frontend)
  if (event.rawPath && event.rawPath.includes('createCheckoutSession')) {
    const body = JSON.parse(event.body || '{}');
    const userId = body.userId;
    const billingCycle: BillingCycle = body.billingCycle || BillingCycle.MONTHLY;

    if (!userId) {
      return createResponse(400, { message: 'Missing userId in request body.' }, true);
    }

    // Select the price ID based on the billing cycle
    let priceId = '';
    if (billingCycle === 'yearly') {
      priceId = process.env.STRIPE_YEARLY_PRICE_ID as string;
    } else {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID as string;
    }
    if (!priceId) {
      return createResponse(500, { message: 'Price ID not configured.' }, true);
    }

    // success/cancel URLs
    const successUrl =
      process.env.STRIPE_SUCCESS_URL ||
      'https://www.instantlyanalyze.com/subscribe-outcome?event=success&session_id={CHECKOUT_SESSION_ID}';
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL ||
      'https://www.instantlyanalyze.com/subscribe-outcome?event=cancel&session_id={CHECKOUT_SESSION_ID}';

    try {
      // Create Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        client_reference_id: userId, 
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            userId,
          },
        },
      });

      console.log(`Checkout session created for user ${userId}: ${session.id}`);
      return createResponse(200, { sessionId: session.id, url: session.url }, true);
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      return createResponse(500, { message: 'Internal Server Error', error: err.message }, true);
    }
  }

  // 4) Handle CANCELING an existing subscription
  if (event.rawPath && event.rawPath.includes('cancelSubscription')) {
    try {
      const body = JSON.parse(event.body || '{}');
      const { userId, cancelSubscription } = body;
      if (!userId || (cancelSubscription === undefined || cancelSubscription === null)) {
        return createResponse(400, { message: 'Missing userId or cancelSubscription in request body.' }, true);
      }

      // Get user's subscriptionId from DB
      const userConfig = await getUserConfigs(ddbClient, userId);
      const subscriptionId = userConfig?.subscription?.subscriptionId;
      if (!subscriptionId) {
        return createResponse(400, { message: 'No active subscription found for user.' }, true);
      }

      // Cancel at period end
      const newSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelSubscription,
      });
      
      const currentUserConfig = await getUserConfigs(ddbClient, userId);
      const updatedConfig: IUserConfigs = {
        ...currentUserConfig,
        userId,
        subscription: {
          ...currentUserConfig?.subscription!,
          current_period_end: newSubscription.current_period_end,
          cancel_at_period_end: newSubscription.cancel_at_period_end,
        },
        preferences: {
          ...currentUserConfig?.preferences!,
        },
      };
      await updateUserConfigs(ddbClient, updatedConfig);

      // Return success message
      return createResponse(200, { success: true, message: cancelSubscription ? 'Subscription will be canceled' : 'Subscription will be reinstated' }, true);
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return createResponse(500, { message: 'Internal Server Error', error: error.message }, true);
    }
  }

  // 5) Handle UPDATING an existing subscription (e.g., monthly -> yearly)
  if (event.rawPath && event.rawPath.includes('updateSubscription')) {
    try {
      const body = JSON.parse(event.body || '{}');
      const { userId, newBillingCycle } = body;
      const typedNewBillingCycle: BillingCycle = newBillingCycle as BillingCycle;
      if (!userId || (typedNewBillingCycle === undefined || typedNewBillingCycle === null)) {
        return createResponse(400, { message: 'Missing userId or newBillingCycle.' }, true);
      }

      let priceId = '';
      //In this case, we are switching to the OTHER billing cycle subscription
      if (typedNewBillingCycle === BillingCycle.MONTHLY) {
        priceId = process.env.STRIPE_MONTHLY_PRICE_ID as string;
      } else {
        priceId = process.env.STRIPE_YEARLY_PRICE_ID as string;
      }
      if (!priceId) {
        return createResponse(500, { message: 'Price ID not configured.' }, true);
      }

      // Get user's subscriptionId from DB
      const userConfig = await getUserConfigs(ddbClient, userId);
      const subscriptionId = userConfig?.subscription?.subscriptionId;
      if (!subscriptionId) {
        return createResponse(400, { message: 'No active subscription found for user.' }, true);
      }

      // Retrieve the subscription to find the subscription item
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (!subscription.items.data.length) {
        return createResponse(400, { message: 'Subscription has no items.' }, true);
      }

      // Usually only one subscription item, so take the first
      const subscriptionItemId = subscription.items.data[0].id;

      // Update subscription to the new price
      await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscriptionItemId,
            price: priceId, 
          },
        ],
        // For immediate changes, you might add:
        proration_behavior: 'always_invoice' 
      });

      const currentUserConfig = await getUserConfigs(ddbClient, userId);
      const updatedConfig: IUserConfigs = {
        ...currentUserConfig,
        userId,
        subscription: {
          ...currentUserConfig?.subscription!,
          billingCycle: typedNewBillingCycle,
        },
        preferences: {
          ...currentUserConfig?.preferences!,
        },
      };
      await updateUserConfigs(ddbClient, updatedConfig);
      // Return success message
      return createResponse(200, { success: true, message: `${toUpperCamelCase(typedNewBillingCycle)} subscription cycle will used. Check email for invoice details.`}, true);
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      return createResponse(500, { message: 'Internal Server Error', error: error.message }, true);
    }
  }

  // 6) If no branch matches, return a 404
  return createResponse(404, { message: 'Route not found.' }, true);
};
