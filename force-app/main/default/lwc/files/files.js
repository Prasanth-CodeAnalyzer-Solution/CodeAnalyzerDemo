import { LightningElement, track } from 'lwc';
import getAllScannerReportFiles from '@salesforce/apex/File.getAllScannerReportFiles';
import getCSVFileContent from '@salesforce/apex/File.getCSVFileContent';
import getCategoryCounts from '@salesforce/apex/File.getCategoryCounts';
import getEngineCounts from '@salesforce/apex/File.getEngineCounts';
import getSeverityCounts from '@salesforce/apex/File.getSeverityCounts';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS';
import importVulnerabilityData from '@salesforce/apex/File.importVulnerabilityData';

 
export default class CsvTable extends LightningElement {
    @track data = [];
    @track columns = [];
    @track error;
    @track fileOptions = [];
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
 
    // Initialize Chart.js
   
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
        { label: 'Code Style', value: 'Code Style'}
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
 
    connectedCallback() {
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
        getAllScannerReportFiles()
            .then(files => {
this.fileOptions = files.map(file => ({ label: file.label, value: file.id }));
            })
            .catch(error => {
                this.handleError('Error loading file options', error);
            });
    }

    handleFileSelection(event) {
        this.selectedFileId = event.target.value;
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
        } else {
            this.data = [];
            this.columns = [];
        }
    }
 
    resetFilters() {
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