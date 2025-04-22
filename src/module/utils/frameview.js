const { ApplicationV2 } = foundry.applications.api;
export class FrameView extends ApplicationV2 {
    constructor(...args) {
      super(...args);
    }
  
    /* -------------------------------------------- */
  
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
      id: "frame-viewer",
      classes: ["theme-dark"],
      window: {icon: "fa-solid fa-browser"},
      url: undefined
    };
  
    /* -------------------------------------------- */
  
    /** @inheritDoc */
    _configureRenderOptions(options) {
      super._configureRenderOptions(options);
      const position = options.position;
      position.height = window.innerHeight * 0.9;
      position.width = Math.min(window.innerWidth * 0.9, 1200);
      position.top = (window.innerHeight - position.height) / 2;
      position.left = (window.innerWidth - position.width) / 2;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Create the iframe and set its `src`.
     * @returns {HTMLIFrameElement}
     * @override
     */
    _renderHTML(_context, options) {
      const iframe = document.createElement("iframe");
      iframe.src = this.options.url;
      return iframe;
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    _replaceHTML(iframe, content) {
      content.replaceChildren(iframe);
    }
  }