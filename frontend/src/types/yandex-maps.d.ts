declare global {
  interface Window {
    ymaps: {
      ready: (callback: () => void) => void;
      geocode: (query: string, options?: any) => Promise<any>;
      Map: new (container: HTMLElement, state: any) => any;
      Placemark: new (coordinates: number[], properties?: any, options?: any) => any;
    };
  }
}

export {};
