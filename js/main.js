/*
 JQuery on Ready function
 */

$(function () {

    /*
    var testData = [
        { id: 100, toAddress: '123 Some Street', isDelivered: false, notes: ''},
        { id: 101, toAddress: '456 Electric Avenue', isDelivered: true, notes: 'Package was delivered to old guy with dreadlocks'},
        { id: 102, toAddress: '121b Baker Street', isDelivered: false, notes: ''}
    ];
    */

    // connect to windows azure data store
    // This has the app url and the app key. This app has been registered with Windows Azure - thus the key.
    var client = new WindowsAzure.MobileServiceClient(
            "https://gxe.azure-mobile.net/",
            "DNePoejWXZqIbYJIecOSqdxFrUipDL78"
        ),
        packagesTable = client.getTable("packages");


    function Package(data) {

        // public properties
        this.id = ko.observable(data.id);
        this.toAddress = ko.observable(data.toAddress);
        this.isDelivered = ko.observable(data.isDelivered);
        this.notes = ko.observable(data.notes);

        this.save =  function(){
            console.log("Saving a package to the storage");
            packagesTable.update(ko.toJS(this));
        };

        // do an autosave (could be an explicit save button on the UI)
        this.isDelivered.subscribe(this.save, this);
        this.notes.subscribe(this.save, this);

    }

    function AppVM() {
        var self = this;

        self.packages = ko.observableArray();

        self.newAddress = ko.observable();

        self.isLoggedIn = ko.observable(false);

        /**
         * Add a new package
         */
        self.addPackage = function () {
            var data = { toAddress: self.newAddress(), isDelivered: false, notes: ''};

            // store in the table and then when complete update the screen
            packagesTable.insert(data).then(function () {
                self.packages.push(new Package(data));
            }, function (message) {
                console.log('Call failed.' + message);
            });

            self.newAddress(null);
        };

        self.refreshData = function () {

            console.log("calling refresh data");

            packagesTable.read().then(function(packages){
                console.log("Reading data from storage. " + packages);
                self.packages($.map(packages, function (item) {
                    return new Package(item);
                }));
            }, function(message){
                console.log("Failure on read. " + message);
            });
        };

        self.login = function () {
            // use google accounts for login.
            client.login("google").then(function() {
                self.isLoggedIn(true);
                self.refreshData();

            });
        };

        self.logout = function () {
            self.isLoggedIn(false);
            self.packages([]);
            client.logout();
        };

    }

    ko.applyBindings(new AppVM());
});
