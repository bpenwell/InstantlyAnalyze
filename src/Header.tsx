import './Header.css';

export const Header = () => {
    return (
        <div className="header">
            <a className="logo" href="/en">
                <img alt="Node.js" width="111" height="33" decoding="async" data-nimg="1" /*style="color:transparent"*/ src="/static/images/logo.svg"/>
            </a>
            <nav aria-label="primary">
                <ul className="list-divider-pipe">
                    <li>
                        <a className="" href="/en/learn">Learn</a>
                    </li>
                    <li>
                        <a className="" href="/en/about">About</a>
                    </li>
                    <li>
                        <a className="" href="/en/download">Download</a>
                    </li>
                    <li>
                        <a className="" href="/en/guides">Guides</a>
                    </li>
                        <li>
                            <a className="" href="/en/blog">Blog</a>
                        </li>
                    <li>
                        <a href="https://nodejs.org/docs/latest/api/" className="">Docs</a>
                    </li>
                    <li>
                        <a href="https://openjsf.org/certification" className="">Certification</a>
                    </li>
                </ul>
            </nav>
            <div className="switchers">
                <button className="lang-picker-toggler" type="button" title="Toggle Language" aria-label="Toggle Language" aria-controls="lang-picker" aria-expanded="false">
                    <img alt="Language Switcher" width="25" height="28" decoding="async" data-nimg="1" /*style="color:transparent"*/ src="/static/images/language-picker.svg"/>
                </button>
            </div>
        </div>
    );
}