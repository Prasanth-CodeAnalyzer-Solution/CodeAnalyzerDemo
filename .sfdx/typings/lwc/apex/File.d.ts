declare module "@salesforce/apex/File.getAllScannerReportFiles" {
  export default function getAllScannerReportFiles(): Promise<any>;
}
declare module "@salesforce/apex/File.getCSVFileContent" {
  export default function getCSVFileContent(param: {fileId: any, categorySearch: any, engineSearch: any, ruleSearch: any}): Promise<any>;
}
declare module "@salesforce/apex/File.importVulnerabilityData" {
  export default function importVulnerabilityData(param: {fileId: any}): Promise<any>;
}
declare module "@salesforce/apex/File.getCategoryCounts" {
  export default function getCategoryCounts(param: {fileId: any}): Promise<any>;
}
declare module "@salesforce/apex/File.getEngineCounts" {
  export default function getEngineCounts(param: {fileId: any}): Promise<any>;
}
declare module "@salesforce/apex/File.getSeverityCounts" {
  export default function getSeverityCounts(param: {fileId: any}): Promise<any>;
}
