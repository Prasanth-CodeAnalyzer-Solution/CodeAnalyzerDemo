public with sharing class GitHubController {
    private static final String GITHUB_API_BASE_URL = 'https://api.github.com/';
    private static final String ACCESS_TOKEN = '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'; // Use secure methods to handle tokens

    @AuraEnabled(cacheable=true)
    public static List<String> getRepositories() {
        String endpoint = GITHUB_API_BASE_URL + 'user/repos';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + ACCESS_TOKEN);
        req.setHeader('Accept', 'application/vnd.github.v3+json');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        System.debug('Response from getRepositories::' + res.getBody());
        List<String> repoNames = new List<String>();
        if (res.getStatusCode() == 200) {
            List<Object> repos = (List<Object>) JSON.deserializeUntyped(res.getBody());
            for (Object repo : repos) {
                Map<String, Object> repoMap = (Map<String, Object>) repo;
                repoNames.add((String) repoMap.get('name'));
            }
        } else {
            System.debug('Error Response::' + res.getBody());
        }
        return repoNames;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getBranches(String repositoryName) {
        String endpoint = GITHUB_API_BASE_URL + 'repos/prasanthcodescan/' + repositoryName + '/branches'; 
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + ACCESS_TOKEN);
        req.setHeader('Accept', 'application/vnd.github.v3+json');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        List<String> branchNames = new List<String>();
        if (res.getStatusCode() == 200) {
            List<Object> branches = (List<Object>) JSON.deserializeUntyped(res.getBody());
            for (Object branch : branches) {
                Map<String, Object> branchMap = (Map<String, Object>) branch;
                branchNames.add((String) branchMap.get('name'));
            }
        }
        return branchNames;
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getFilteredScannerReportFiles(String reportType, String repoName, String branchName) {
        // Check if the report type is Delta Report
        String filterPatternReportType;
        if (reportType == 'Delta Report') {
            filterPatternReportType = '%Final Delta Report%';
        } else {
            filterPatternReportType = '%' + reportType + '%';
        }
        
        // Construct the filter pattern to include each value
        //String filterPatternReportType = '%' + reportType + '%';
        String filterPatternRepoName = '%' + repoName + '%';
        String filterPatternBranchName = '%' + branchName + '%';
        
        // Query to filter files that contain all three values in any order
        List<ContentVersion> contentVersions = [
            SELECT ContentDocumentId, Title, CreatedDate 
            FROM ContentVersion 
            WHERE Title LIKE :filterPatternReportType 
            AND Title LIKE :filterPatternRepoName 
            AND Title LIKE :filterPatternBranchName 
            ORDER BY CreatedDate DESC
        ];

        List<Map<String, String>> files = new List<Map<String, String>>();
        for (ContentVersion cv : contentVersions) {
            Map<String, String> fileData = new Map<String, String>();
            fileData.put('id', cv.ContentDocumentId);
            fileData.put('label', cv.Title + ' - ' + cv.CreatedDate.format('yyyy-MM-dd HH:mm:ss'));
            files.add(fileData);
        }
        return files;
    }

    @AuraEnabled(cacheable=true)
    public static String getCSVFileContent(Id fileId, String categorySearch, String engineSearch, String ruleSearch) {
        ContentVersion file = [SELECT VersionData FROM ContentVersion WHERE ContentDocumentId = :fileId LIMIT 1];
        String csvContent = file.VersionData.toString();  // Convert Blob to String
        System.debug('Original CSV Content: ' + csvContent);
        
        List<String> foundLines = new List<String>();
        List<String> lines = csvContent.split('\n');
        
        if (lines.isEmpty()) {
            // Handle empty file case
            return EncodingUtil.base64Encode(Blob.valueOf(''));
        }
        
        // Header mapping to determine column indices using regex
        List<String> headers = lines[0].split(',');

        // Regex patterns for matching headers
        Pattern categoryPattern = Pattern.compile('(?i)\\bcategory\\b');  // Case-insensitive 'category'
        Pattern enginePattern = Pattern.compile('(?i)\\bengine\\b');      // Case-insensitive 'engine'
        Pattern rulePattern = Pattern.compile('(?i)\\brule\\b');          // Case-insensitive 'rule'

        Integer categoryIndex = null;
        Integer engineIndex = null;
        Integer ruleIndex = null;

        for (Integer i = 0; i < headers.size(); i++) {
            String header = headers[i].trim();

            if (categoryPattern.matcher(header).find()) {
                categoryIndex = i;
            } else if (enginePattern.matcher(header).find()) {
                engineIndex = i;
            } else if (rulePattern.matcher(header).find()) {
                ruleIndex = i;
            }
        }

        // Debug output to check indices
        System.debug('Category Index: ' + categoryIndex);
        System.debug('Engine Index: ' + engineIndex);
        System.debug('Rule Index: ' + ruleIndex);

        // Add header to found lines
        foundLines.add(lines[0]);

        if (String.isBlank(categorySearch) && String.isBlank(engineSearch) && String.isBlank(ruleSearch)) {
            // If all filters are null or empty, include all lines
            for (Integer i = 1; i < lines.size(); i++) {
                foundLines.add(lines[i]);
            }
        } else {
            // Convert search terms to lower case for case-insensitive comparison
            String categorySearchLower = String.isBlank(categorySearch) ? null : categorySearch.toLowerCase();
            String engineSearchLower = String.isBlank(engineSearch) ? null : engineSearch.toLowerCase();
            String ruleSearchLower = String.isBlank(ruleSearch) ? null : ruleSearch.toLowerCase();
            
            for (Integer i = 1; i < lines.size(); i++) {
                List<String> columns = lines[i].split(',');
                if (columns.size() > Math.max(categoryIndex, Math.max(engineIndex, ruleIndex))) {
                    String category = columns[categoryIndex].trim().toLowerCase();
                    String engine = columns[engineIndex].trim().toLowerCase();
                    String rule = columns[ruleIndex].trim().toLowerCase();

                    Boolean matchesCategory = categorySearchLower == null || category.contains(categorySearchLower);
                    Boolean matchesEngine = engineSearchLower == null || engine.contains(engineSearchLower);
                    Boolean matchesRule = ruleSearchLower == null || rule.contains(ruleSearchLower);

                    if (matchesCategory && matchesEngine && matchesRule) {
                        foundLines.add(lines[i]);
                    }
                }
            }
        }
        
        // Join found lines into a single string
        String foundContent = String.join(foundLines, '\n');
        
        // Log the found content
        System.debug('Filtered CSV Content: ' + foundContent);
        
        // Convert the found content to Blob and then encode to Base64
        Blob contentBlob = Blob.valueOf(foundContent);
        String encodedContent = EncodingUtil.base64Encode(contentBlob);
        
        return encodedContent;
    }



        @AuraEnabled
        public static void importVulnerabilityData(Id fileId) {
            // Step 1: Delete existing Vulnerability records
            List<Vulnerability__c> existingRecords = [SELECT Id FROM Vulnerability__c];
            delete existingRecords;

            // Step 2: Get the CSV content of the selected file
            ContentVersion file = [
                SELECT VersionData 
                FROM ContentVersion 
                WHERE ContentDocumentId = :fileId 
                LIMIT 1
            ];
            String csvContent = file.VersionData.toString();  // Convert Blob to String
            
            // Step 3: Parse the CSV content and create Vulnerability records
            List<Vulnerability__c> newRecords = new List<Vulnerability__c>();
            List<String> lines = csvContent.split('\n');

            // Assume the first line contains headers
            if (!lines.isEmpty()) {
                List<String> headers = lines[0].split(',');

                for (Integer i = 1; i < lines.size(); i++) {
                    List<String> columns = lines[i].split(',');

                    Vulnerability__c vuln = new Vulnerability__c();
                    // Map CSV columns to object fields
                    vuln.Problem__c = columns[0].trim();  // Assuming the first column is Name
                    vuln.Severity__c = columns[1].trim();  // Assuming the second column is Category
                    vuln.File__c = columns[2].trim();  // Assuming the third column is Engine
                    vuln.Line__c = columns[3].trim();  // Assuming the fourth column is Severity
                    vuln.Column__c = columns[4].trim();  // Assuming the first column is Name
                    vuln.Rule__c = columns[5].trim();  // Assuming the second column is Category
                    vuln.Description__c = columns[6].trim();  // Assuming the third column is Engine
                    vuln.URL__c = columns[7].trim();
                    vuln.Category__c = columns[8].trim();  // Assuming the third column is Engine
                    vuln.Engine__c = columns[9].trim();

                    newRecords.add(vuln);
                }
            }

            // Step 4: Insert the new Vulnerability records
            if (!newRecords.isEmpty()) {
                insert newRecords;
            }
        }


    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getCategoryCounts(Id fileId) {
        ContentVersion file = [SELECT VersionData FROM ContentVersion WHERE ContentDocumentId = :fileId LIMIT 1];
        String csvContent = file.VersionData.toString();  // Convert Blob to String

        Map<String, Integer> categoryCounts = new Map<String, Integer>();
        List<String> lines = csvContent.split('\n');

        if (lines.isEmpty()) {
            return categoryCounts;
        }

        // Regex pattern for matching the "Category" header
        Pattern categoryPattern = Pattern.compile('(?i)\\bcategory\\b');  // Case-insensitive 'category'
        Pattern exclusionPattern = Pattern.compile('^(http|https)://|(?:[a-zA-Z]:)?[\\/\\\\]|\\b\\w*[0-9]+\\w*\\b'); // Excludes URLs, file paths, and alphanumeric strings
        
        // Find the index of the "Category" column
        List<String> headers = lines[0].split(',');
        Integer categoryIndex = null;

        for (Integer i = 0; i < headers.size(); i++) {
            String header = headers[i].trim();

            if (categoryPattern.matcher(header).find()) {
                categoryIndex = i;
                break;
            }
        }

        if (categoryIndex == null) {
            return categoryCounts;  // If no Category column is found, return an empty map
        }

        // Count occurrences of each category, excluding alphanumeric strings and URLs/file paths
        for (Integer i = 1; i < lines.size(); i++) {
            List<String> columns = lines[i].split(',');
            if (columns.size() > categoryIndex) {
                String category = columns[categoryIndex].trim();

                // Exclude entries matching the exclusion pattern
                if (!exclusionPattern.matcher(category).find()) {
                    if (categoryCounts.containsKey(category)) {
                        categoryCounts.put(category, categoryCounts.get(category) + 1);
                    } else {
                        categoryCounts.put(category, 1);
                    }
                }
            }
        }

        return categoryCounts;
    }




    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getEngineCounts(Id fileId) {
        ContentVersion file = [SELECT VersionData FROM ContentVersion WHERE ContentDocumentId = :fileId LIMIT 1];
        String csvContent = file.VersionData.toString();  // Convert Blob to String

        Map<String, Integer> engineCounts = new Map<String, Integer>();
        List<String> lines = csvContent.split('\n');

        if (lines.isEmpty()) {
            return engineCounts;
        }

        // Regex pattern for matching the "Engine" header
        Pattern enginePattern = Pattern.compile('(?i)\\bengine\\b');  // Case-insensitive 'engine'
        
        // Find the index of the "Engine" column
        List<String> headers = lines[0].split(',');
        Integer engineIndex = null;

        for (Integer i = 0; i < headers.size(); i++) {
            String header = headers[i].trim();

            if (enginePattern.matcher(header).find()) {
                engineIndex = i;
                break;
            }
        }

        if (engineIndex == null) {
            return engineCounts;  // If no Engine column is found, return empty map
        }

        // Regex pattern to exclude URLs and paths
        Pattern urlPattern = Pattern.compile('^(http|https)://|(?:[a-zA-Z]:)?[\\/\\\\]');  // Matches URLs and file paths

        // Count occurrences of each engine type
        for (Integer i = 1; i < lines.size(); i++) {
            List<String> columns = lines[i].split(',');
            if (columns.size() > engineIndex) {
                String engine = columns[engineIndex].trim();
                
                // Exclude engine values that are URLs or file paths
                if (!urlPattern.matcher(engine).find()) {
                    if (engineCounts.containsKey(engine)) {
                        engineCounts.put(engine, engineCounts.get(engine) + 1);
                    } else {
                        engineCounts.put(engine, 1);
                    }
                }
            }
        }

        return engineCounts;
    }

        @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getSeverityCounts(Id fileId) {
        ContentVersion file = [SELECT VersionData FROM ContentVersion WHERE ContentDocumentId = :fileId LIMIT 1];
        String csvContent = file.VersionData.toString();  // Convert Blob to String

        Map<String, Integer> severityCounts = new Map<String, Integer>();
        List<String> lines = csvContent.split('\n');

        if (lines.isEmpty()) {
            return severityCounts;
        }

        // Regex pattern for matching the "Severity" header
        Pattern severityPattern = Pattern.compile('(?i)\\bseverity\\b');  // Case-insensitive 'severity'
        
        // Find the index of the "Severity" column
        List<String> headers = lines[0].split(',');
        Integer severityIndex = null;

        for (Integer i = 0; i < headers.size(); i++) {
            String header = headers[i].trim();

            if (severityPattern.matcher(header).find()) {
                severityIndex = i;
                break;
            }
        }

        if (severityIndex == null) {
            return severityCounts;  // If no Severity column is found, return empty map
        }

        // Count occurrences of each severity level
        for (Integer i = 1; i < lines.size(); i++) {
            List<String> columns = lines[i].split(',');
            if (columns.size() > severityIndex) {
                String severity = columns[severityIndex].trim();
                
                if (severityCounts.containsKey(severity)) {
                    severityCounts.put(severity, severityCounts.get(severity) + 1);
                } else {
                    severityCounts.put(severity, 1);
                }
            }
        }

        return severityCounts;
    }
}