declare module 'pdfmake' {
  interface TFontDictionary {
    [fontName: string]: {
      normal?: string;
      bold?: string;
      italics?: string;
      bolditalics?: string;
    };
  }

  interface TDocumentDefinitions {
    pageSize?: string;
    pageOrientation?: 'portrait' | 'landscape';
    pageMargins?: [number, number, number, number] | number;
    content: any[];
    styles?: Record<string, any>;
    defaultStyle?: Record<string, any>;
    images?: Record<string, string>;
    [key: string]: any;
  }

  class PdfPrinter {
    constructor(fonts: TFontDictionary);
    createPdfKitDocument(docDefinition: TDocumentDefinitions, options?: any): any;
  }

  export { TFontDictionary, TDocumentDefinitions };
  export default PdfPrinter;
}
