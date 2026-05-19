import './PageLoader.css';

const PageLoader = () => (
  <div className="pl-root">
    <div className="pl-center">
      <div className="pl-logo-wrap">
        <div className="pl-logo-mark">
          <svg width="28" height="28" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M7 1.5C7 1.5 4.5 4.2 4.5 7C4.5 8.38 5.62 9.5 7 9.5C8.38 9.5 9.5 8.38 9.5 7C9.5 4.2 7 1.5 7 1.5Z"
              fill="white"
              opacity=".95"
            />
            <path
              d="M7 9.5C7 9.5 9.8 8.7 11.5 7C10.2 10.8 7 12.5 7 12.5C7 12.5 3.8 10.8 2.5 7C4.2 8.7 7 9.5 7 9.5Z"
              fill="white"
              opacity=".55"
            />
          </svg>
        </div>
        <div className="pl-ring" />
        <div className="pl-ring pl-ring--2" />
      </div>
      <div className="pl-name">SoulSynergy</div>
      <div className="pl-dots">
        <span /><span /><span />
      </div>
    </div>
  </div>
);

export default PageLoader;
