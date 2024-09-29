public with sharing class AccountInsertClassDemo {
    public AccountInsertClassDemo() {

    }
    public static void insertAccount(List<Account> accList){
        for(Account acc:accList){
            acc.Description='Happy Welcome';
        }
    }
    public static void insertAccountOpp(List<Account> accList){
        List<Opportunity> oppList = new List<Opportunity>();
        for(Account acc:accList){
            Opportunity opp = new Opportunity();
            opp.Name = acc.name;
            opp.CloseDate = System.Today();
            opp.StageName = 'Prospecting';
            opp.AccountId = acc.id;
            oppList.add(opp);
            system.debug('Print');
            system.debug('PrintScan');
            system.debug('PrintScanDemo23');
            system.debug('MyNewDemo23456789'); 
        }
        if(oppList.size()>0){
            insert oppList;
        }
    }
}