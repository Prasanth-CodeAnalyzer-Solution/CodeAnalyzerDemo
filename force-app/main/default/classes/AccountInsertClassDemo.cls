/**
 * @description This class handles the insertion of Account and related Opportunity records.
 * It performs necessary validation, including CRUD and FLS checks, before executing any DML operations.
 */
public with sharing class AccountInsertClassDemo {
    /**
     * @description Inserts a list of Account records and updates their description.
     * Performs CRUD and FLS validation before insertion.
     *
     * @param accList The list of Account records to be inserted.
     * @throws CustomException If the user lacks permission to insert accounts.
     */
    public static void insertAccount(List<Account> accList){
        if(Schema.sObjectType.Account.isCreateable()){
            for(Account acc : accList){
                if(Schema.sObjectType.Account.fields.Description.isUpdateable()){
                    acc.Description = 'Happy';
                    acc.Rating = 'Hot';
                    acc.Industry = 'Agriculture';
                }
            }
            insert accList;
        } else {
            throw new CustomException('You do not have permission to create Account records.');
        }
    }
 
    /**
     * @description Inserts related Opportunity records for a given list of Account records.
     * Performs CRUD validation before inserting opportunities.
     *
     * @param accList The list of Account records for which Opportunities are created.
     * @throws CustomException If the user lacks permission to insert opportunities.
     */
    public static void insertAccountOpp(List<Account> accList){
        if(Schema.sObjectType.Opportunity.isCreateable()){
            List<Opportunity> oppList = new List<Opportunity>();
            for(Account acc : accList){
                Opportunity opp = new Opportunity();
                opp.Name = acc.Name;
                opp.CloseDate = System.Today();
                opp.StageName = 'Prospecting';
                opp.AccountId = acc.Id;
                oppList.add(opp);
            }
            if(oppList.size() > 0){
                insert oppList;
            }
        } else {
            throw new CustomException('You do not have permission to create Opportunity records.');
        }
    }
    /**
     * @description Inserts a list of Account records and updates their description.
     * Performs CRUD and FLS validation before insertion.
     *
     * @param accList The list of Account records to be inserted data.
     * @throws CustomException If the user lacks permission to insert accounts.
     */
    public static void insertNewAccount(List<Account> accList){
        if(Schema.sObjectType.Account.isCreateable()){
            for(Account acc : accList){
                if(Schema.sObjectType.Account.fields.Description.isUpdateable()){
                    acc.Description = 'Happy Welcome Account Checks Monday';
                }
            }
            insert accList;
        } else {
            throw new CustomException('You do not have permission to create Account records.');
        }
    }
}