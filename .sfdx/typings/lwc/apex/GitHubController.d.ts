declare module "@salesforce/apex/GitHubController.getRepositories" {
  export default function getRepositories(): Promise<any>;
}
declare module "@salesforce/apex/GitHubController.getBranches" {
  export default function getBranches(param: {repositoryName: any}): Promise<any>;
}
declare module "@salesforce/apex/GitHubController.getFilteredScannerReportFiles" {
  export default function getFilteredScannerReportFiles(param: {reportType: any, repoName: any, branchName: any}): Promise<any>;
}
declare module "@salesforce/apex/GitHubController.getCSVFileContent" {
  export default function getCSVFileContent(param: {fileId: any, categorySearch: any, engineSearch: any, ruleSearch: any}): Promise<any>;
}
declare module "@salesforce/apex/GitHubController.importVulnerabilityData" {
  export default function importVulnerabilityData(param: {fileId: any}): Promise<any>;
}
declare module "@salesforce/apex/GitHubController.getCategoryCounts" {
  export default function getCategoryCounts(param: {fileId: any}): Promise<any>;
}
declare module "@salesforce/apex/GitHubController.getEngineCounts" {
  export default function getEngineCounts(param: {fileId: any}): Promise<any>;
}
declare module "@salesforce/apex/GitHubController.getSeverityCounts" {
  export default function getSeverityCounts(param: {fileId: any}): Promise<any>;
}
