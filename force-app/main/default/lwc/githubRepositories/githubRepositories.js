import { LightningElement, wire, track } from 'lwc';
import getRepositories from '@salesforce/apex/GitHubController.getRepositories';
import getBranches from '@salesforce/apex/GitHubController.getBranches';
import getFilteredScannerReportFiles from '@salesforce/apex/GitHubController.getFilteredScannerReportFiles';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS';
import getCSVFileContent from '@salesforce/apex/GitHubController.getCSVFileContent';
import getCategoryCounts from '@salesforce/apex/GitHubController.getCategoryCounts';
import getEngineCounts from '@salesforce/apex/GitHubController.getEngineCounts';
import getSeverityCounts from '@salesforce/apex/GitHubController.getSeverityCounts';
import importVulnerabilityData from '@salesforce/apex/GitHubController.importVulnerabilityData';

export default class GithubRepositories extends LightningElement {
    @track repoOptions = [];
    @track branchOptions = [];
    @track reportTypeOptions = [
        { label: 'Delta Report', value: 'Delta Report' },
        { label: 'Overall Report', value: 'Overall Report' }
    ]; // Updated to match example files
    @track fileOptions = [];
    @track noFilesFound = false;
    @track selectedRepo;
    @track selectedBranch;
    @track selectedReportType;
    @track selectedFileId;

    @track branchesVisible = false;
    @track reportTypeVisible = false;
    @track showFilters = false;

    @track paginatedData = [];
    @track currentPage = 1;
    pageSize = 10; // Number of records per page

    @track data = [];
    @track columns = [];
    @track error;

    @track categoryOptions = [];
    @track engineOptions = [];
    @track ruleOptions = [];
    @track selectedFileId;
    @track selectedCategory;
    @track selectedEngine;
    @track selectedRule;
    @track isCategoryDisabled = false;
    @track isEngineDisabled = false;
    @track isRuleDisabled = false;
    @track categoryCounts = [];
    @track engineCounts = [];
    @track severityCounts = [];
    chartInitialized = false;

    categoryChart;
    engineChart;

    @track categoryCountColumns = [
        { label: 'Category', fieldName: 'category' },
        { label: 'Count', fieldName: 'count' }
    ];

    @track engineCountColumns = [
        { label: 'Engine', fieldName: 'engine' },
        { label: 'Count', fieldName: 'count' }
    ];

    @track severityCountColumns = [
        { label: 'Severity', fieldName: 'severity' },
        { label: 'Count', fieldName: 'count' }
    ];

    // Initialize options
    categoryOptions = [
        { label: 'Design', value: 'Design' },
        { label: 'Best Practices', value: 'Best Practices' },
        { label: 'Security', value: 'Security' },
        { label: 'Performance', value: 'Performance' },
        { label: 'Documentation', value: 'Documentation' },
        { label: 'Code Style', value: 'Code Style' }
    ];

    engineOptions = [
        { label: 'PMD', value: 'PMD' },
        { label: 'Design', value: 'Design' }
    ];

    ruleOptions = [
        { label: 'ApexDoc', value: 'ApexDoc' },
        { label: 'ExcessiveParameterList', value: 'ExcessiveParameterList' },
        { label: 'AvoidDebugStatements', value: 'AvoidDebugStatements' },
        { label: 'DebugsShouldUseLoggingLevel', value: 'DebugsShouldUseLoggingLevel' },
        { label: 'ApexSOQLInjection', value: 'ApexSOQLInjection' },
        { label: 'CyclomaticComplexity', value: 'CyclomaticComplexity' },
        { label: 'ApexCRUDViolation', value: 'ApexCRUDViolation' },
        { label: 'StdCyclomaticComplexity', value: 'StdCyclomaticComplexity' },
        { label: 'NcssMethodCount', value: 'NcssMethodCount' },
        { label: 'CognitiveComplexity', value: 'CognitiveComplexity' },
        { label: 'UnusedLocalVariable', value: 'UnusedLocalVariable' },
        { label: 'IfStmtsMustUseBraces', value: 'IfStmtsMustUseBraces' },
        { label: 'IfElseStmtsMustUseBraces', value: 'IfElseStmtsMustUseBraces' }
    ];

    @wire(getRepositories)
    wiredRepos({ error, data }) {
        if (data) {
            this.repoOptions = data.map(repo => ({ label: repo, value: repo }));
            this.noFilesFound = false;
        } else if (error) {
            console.error('Error fetching repositories:', error);
        }
    }

    handleRepoChange(event) {
        this.selectedRepo = event.detail.value;
        this.branchesVisible = true;
        this.reportTypeVisible = false; // Reset report type visibility
        this.selectedBranch = null; // Reset the branch selection
        this.selectedReportType = null; // Reset the report type selection
        this.fileOptions = []; // Clear file options when repository changes
        this.noFilesFound = false;
        getBranches({ repositoryName: this.selectedRepo })
            .then(result => {
                this.branchOptions = result.map(branch => ({ label: branch, value: branch }));
            })
            .catch(error => {
                console.error('Error fetching branches:', error);
            });
    }

    handleBranchChange(event) {
        this.selectedBranch = event.detail.value;
        this.selectedReportType = null;
        this.reportTypeVisible = true; // Show report type combobox after selecting a branch
        this.fileOptions = []; // Clear file options when branch changes
        this.noFilesFound = false;
    }

    handleReportTypeChange(event) {
        this.selectedReportType = event.detail.value;
        this.loadFileOptions();
        loadScript(this, ChartJS)
            .then(() => {
                this.chartInitialized = true;
            })
            .catch(error => {
                this.handleError('Error loading Chart.js', error);
            });
    }

    loadFileOptions() {
        console.log('Loading files with:', {
            reportType: this.selectedReportType,
            repoName: this.selectedRepo,
            branchName: this.selectedBranch
        });
        getFilteredScannerReportFiles({
            reportType: this.selectedReportType,
            repoName: this.selectedRepo,
            branchName: this.selectedBranch
        })
            .then(files => {
                this.fileOptions = files.map(file => ({ label: file.label, value: file.id }));
                this.noFilesFound = this.fileOptions.length === 0;
                console.log('Loaded fileOptions:', JSON.stringify(this.fileOptions));
            })
            .catch(error => {
                this.noFilesFound = true;
                console.error('Error loading file options:', error);
            });
    }

    handleFileSelection(event) {
        this.selectedFileId = event.target.value;
        console.log('this.selectedFileId::' + this.selectedFileId);
        if (this.selectedFileId) {
            // Call the Apex method to import the CSV data into the Vulnerability object
            importVulnerabilityData({ fileId: this.selectedFileId })
                .then(() => {
                    // Handle success, e.g., show a success message
                    console.log('Vulnerability data imported successfully');
                })
                .catch(error => {
                    // Handle error, e.g., show an error message
                    console.error('Error importing vulnerability data', error);
                });
        }
        this.loadFileData();
        this.loadCategoryCounts(); // Load category counts when file is selected
        this.loadEngineCounts();   // Load engine counts when file is selected
        this.loadSeverityCounts(); // Load severity counts when file is selected
        this.renderCategoryChart();
        this.renderEngineChart();
    }

    handleFileChange(event) {
        this.selectedFileId = event.detail.value;
        this.loadFileData();
        this.loadCategoryCounts(); // Load category counts when file is selected
        this.loadEngineCounts();   // Load engine counts when file is selected
        this.loadSeverityCounts(); // Load severity counts when file is selected
        this.renderCategoryChart();
        this.renderEngineChart();
    }

    applyFilters(){
        this.showFilters = true;
    }

    loadCategoryCounts() {
        if (this.selectedFileId && this.chartInitialized) {
            getCategoryCounts({ fileId: this.selectedFileId })
                .then(counts => {
                    console.log("Raw category counts:", counts); // Log raw data
                    this.categoryCounts = Object.entries(counts).map(([category, count]) => ({ category, count }));
                    console.log("Processed category counts:", this.categoryCounts); // Log processed data
                    this.renderCategoryChart();
                })
                .catch(error => {
                    this.handleError('Error loading category counts', error);
                });
        }
    }



    renderCategoryChart() {
        if (!this.categoryCounts || !this.categoryCounts.length) {
            return;
        }

        setTimeout(() => {
            const ctx = this.template.querySelector('canvas.categoryChart')?.getContext('2d');
            if (!ctx) {
                return;
            }

            if (this.categoryChart) {
                this.categoryChart.destroy();
            }

            try {
                this.categoryChart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: this.categoryCounts.map(count => count.category),
                        datasets: [{
                            label: 'Category Counts',
                            data: this.categoryCounts.map(count => count.count),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(255, 159, 64, 0.2)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            } catch (error) {
                console.error("Error rendering category chart", error);
            }
        }, 100);
    }



    loadFileData() {
        if (this.selectedFileId) {
            getCSVFileContent({ fileId: this.selectedFileId, categorySearch: this.selectedCategory || '', engineSearch: this.selectedEngine || '', ruleSearch: this.selectedRule || '' })
                .then(result => {
                    const csvData = atob(result); // Decode base64
                    this.processCSVData(csvData);
                })
                .catch(error => {
                    this.handleError('Error loading CSV data', error);
                });
        }
    }

    loadEngineCounts() {
        if (this.selectedFileId && this.chartInitialized) {
            getEngineCounts({ fileId: this.selectedFileId })
                .then(counts => {
                    console.log("Raw category counts:", counts); // Log raw data
                    this.engineCounts = Object.entries(counts).map(([engine, count]) => ({ engine, count }));
                    console.log("Processed category counts:", this.engineCounts); // Log processed data
                    this.renderEngineChart();
                })
                .catch(error => {
                    this.handleError('Error loading engine counts', error);
                });
        }
    }


    renderEngineChart() {
        if (!this.engineCounts || !this.engineCounts.length) {
            return;
        }

        setTimeout(() => {
            const ctx = this.template.querySelector('canvas.engineChart')?.getContext('2d');
            if (!ctx) {
                return;
            }

            if (this.engineChart) {
                this.engineChart.destroy();
            }

            try {
                this.engineChart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: this.engineCounts.map(count => count.engine),
                        datasets: [{
                            label: 'Engine Counts',
                            data: this.engineCounts.map(count => count.count),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(255, 159, 64, 0.2)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            } catch (error) {
                console.error("Error rendering engine chart", error);
            }
        }, 100);
    }

    loadSeverityCounts() {
        if (this.selectedFileId) {
            getSeverityCounts({ fileId: this.selectedFileId })
                .then(counts => {

                    console.log("Raw category counts:", counts); // Log raw data
                    this.severityCounts = Object.entries(counts).map(([severity, count]) => ({ severity, count }));
                    console.log("Processed category counts:", this.severityCounts); // Log processed data
                })
                .catch(error => {
                    this.handleError('Error loading severity counts', error);
                });
        }
    }
    // Getter for total records
    get totalRecords() {
        return this.data.length;
    }

    // Getter for total pages
    get totalPages() {
        return Math.ceil(this.totalRecords / this.pageSize);
    }

    // Getter to disable 'Previous' button if on the first page
    get disablePrevious() {
        return this.currentPage === 1;
    }

    // Getter to disable 'Next' button if on the last page
    get disableNext() {
        return this.currentPage === this.totalPages;
    }

    // Handle 'Previous' button click
    handlePrevious() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePaginatedData();
        }
    }

    // Handle 'Next' button click
    handleNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePaginatedData();
        }
    }

    // Update paginated data based on the current page
    updatePaginatedData() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.paginatedData = this.data.slice(start, end);
    }

    processCSVData(csvData) {
        if (!csvData) {
            this.data = [];
            this.columns = [];
            return;
        }
        const rows = csvData.split('\n').filter(row => row.trim() !== ''); // Filter out empty rows
        if (rows.length > 0) {
            const headers = rows[0].split(',').map(header => header.trim());
            this.columns = headers.map(header => ({ label: header, fieldName: header }));
            this.data = rows.slice(1).map(row => {
                const values = row.split(',').map(value => value.trim());
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || ''; // Handle missing values
                });
                return obj;
            });
            // Initialize pagination
            this.currentPage = 1;
            this.updatePaginatedData();
        } else {
            this.data = [];
            this.columns = [];
        }
    }

    resetFilters() {
        this.showFilters = false;
        this.selectedFileId = '';
        this.selectedCategory = '';
        this.selectedEngine = '';
        this.selectedRule = '';
        this.isCategoryDisabled = false; // Re-enable category filter
        this.isEngineDisabled = false; // Re-enable engine filter
        this.isRuleDisabled = false; // Re-enable rule filter
        // Clear the data
        this.data = [];
        this.categoryCounts = [];
        this.engineCounts = [];
        this.severityCounts = [];
        // Destroy all charts
        if (this.categoryChart) {
            this.categoryChart.destroy();
            this.categoryChart = null;
        }
        if (this.engineChart) {
            this.engineChart.destroy();
            this.engineChart = null;
        }
    }

    handleCategoryChange(event) {
        this.selectedCategory = event.detail.value;
        this.isCategoryDisabled = true; // Disable category filter after selection
        this.loadFileData();
    }

    handleEngineChange(event) {
        this.selectedEngine = event.detail.value;
        this.isEngineDisabled = true; // Disable engine filter after selection
        this.loadFileData();
    }

    handleRuleChange(event) {
        this.selectedRule = event.detail.value;
        this.isRuleDisabled = true; // Disable rule filter after selection
        this.loadFileData();
    }

    handleError(action, error) {
        let errorMessage = 'Unknown error';
        if (error) {
            if (error.body && error.body.message) {
                errorMessage = error.body.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
        }
        this.error = `${action}: ${errorMessage}`;
    }
}