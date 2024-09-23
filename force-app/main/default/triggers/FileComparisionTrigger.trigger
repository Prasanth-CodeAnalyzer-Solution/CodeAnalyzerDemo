trigger FileComparisionTrigger on ContentVersion (after insert) {
    System.debug('Calling Trigger');
    // Prevent recursive processing
    if (FileComparison.isProcessing) {
        return;
    }
    FileComparison.isProcessing = true;

    try {
        // List to hold relevant ContentVersion records
        List<ContentVersion> relevantFiles = new List<ContentVersion>();

        // Collect ContentVersion records with the specific title pattern
        for (ContentVersion cv : Trigger.new) {
            System.debug('Triggered:::'+cv);
            if (cv.Title.contains('Code Scanner Delta Report_CodeScanningSolution_main_Jira Story')) {
                relevantFiles.add(cv);
            }
        }
        System.debug('Triggered Relevant Files:::'+relevantFiles);


        // Ensure we have at least two files to compare
        if (relevantFiles.size() > 0) {
            System.debug('File comparision class calling');
            // Call the FileComparison class method to process these files
            FileComparison.compareFilesAndGenerateReport();
        } else {
            System.debug('Not enough relevant files found for comparison.');
        }
    } catch (Exception e) {
        System.debug('Exception in trigger: ' + e.getMessage());
    } finally {
        // Reset processing flag to allow future executions
        FileComparison.isProcessing = false;
    }
}