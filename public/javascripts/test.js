/**
 * Created by hhe on 5/7/2017.
 */

angular.module('myApp', [])
    .controller('myController', myController);

myController.$inject = ['$http'];
function myController($http) {
   var  ctrl = this;
   ctrl.search={device_sn: null, parent_clinic: null, status: null, location: null};

    ctrl.testData =
        {
            row: 90,
            received_date: "2015-03-10",
            manufacturer_order_id: "0109551",
            purchase_order: "TZ0215-01",
            manufacturer: "TZ Medical",
            accessory: "Holster Case",
            lot_no: "",
            order_quantity: 3,
            received_quantity: 3,
            deficiency: 0,
            deficient_received_date: null,
            shipping_status: "Complete",
            total_price: null
        };

    ctrl.getData = function() {
        $http.get('http://localhost:3000/get').then(function (res) {
                    console.log(res);
                }, function (err) {
                    console.log(err);
                });
    };

    ctrl.postData = function () {
        $http.post('http://localhost:3000/post', ctrl.testData).then(
            res => {
                console.log('test ', res);
        }, err => {
                console.log(err);
        });
    };

    ctrl.searchtext = function (value) {
        // var search={device_sn: "1300496", parent_clinic: "Heart Smart, Inc", status: "Customer", location: "Device-Out-Others"};
        var search={device_sn: "1300496", parent_clinic: null, status: null, location: "Device-Out-Others"};

        $http.post('http://localhost:3000/search', search).then(function (res) {
            console.log(res);
        }, err => console.log(err));
    }

   ctrl.handleFiles = function () {
       console.log('test');
   };
}


