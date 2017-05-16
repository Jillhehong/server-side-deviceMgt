const config = {
    user: 'postgres', //env var: PGUSER
    database: 'todo', //env var: PGDATABASE
    password: null, //env var: PGPASSWORD
    host: 'localhost', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
};
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const csv = require('csv');
const pgp = require('pg-promise')({  }); // pg-promise module is to connect express to postgresql database
const db = pgp(config); //connect database with configuration
const stringify = require('csv-stringify');
const moment = require('moment');
const cors = require("cors");

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// render index.html at the starting url
//app.get('/', function (req, res) {
 //   res.sendfile('views/index.html');
//});

//get data using pg-promise module
function pgGetSqlUtilityFunc(url, sql) {
    app.get(url, (req, res, next) => {
        // if(req.isAuthenticated()){
        //if(true){
            db.query(sql)
                .then( (response) => {
                    return res.json(response);
                },  (err) => {
                    return res.status(500).json(err);
                });
            pgp.end();
        //}
        //else {
           // return  {error:'please log in'};
        //}

    });
}
///post data using pg-promise module
function pgPostSqlUtilityFunc(url, sql) {
    app.post(url, function(req, res, next){
        // if(req.isAuthenticated()){
        if(true){
            db.query(sql, req.body)
                .then( (response) => {
                    return res.json(response);
                },  (err) => {
                    return res.status(500).json(err);
                });
            pgp.end();
        }
        else {
            return  {error:'please log in'};
        }

    });
}
/*dynamically query based on device_sn, clinic, status and location fields*/
 function dynamicquerySqlUtilityFunc(url, sql) {

     app.post(url, (req, res, next) => {

         // if(req.isAuthenticated()){
        if(true){
            var string = '';
            ///dynamically change where clause
            var arrays = [];
            if(req.body.device_sn) {
                arrays.push('device_sn=${device_sn}');
            }
            if(req.body.parent_clinic) {
                arrays.push('parent_clinic=${parent_clinic}');
            }
            if(req.body.status) {
                arrays.push('status=${status}');
            }
            if(req.body.location) {
                arrays.push('location=${location}');
            }
            if(arrays.length){
                string  = sql + " where "+ arrays.join(' and ');
            } else {
                string  = sql;
            }
            console.log(string);
            db.query(string, req.body)
                .then((response ) => {              
                    return res.json(response);
                }, (err) => {
                    return res.status(500).json(err);
                });
            pgp.end();
        }
        else {
            return  {error:'failed authenticate user'};
        }

    });
}

// download data from database
function downloadData(url, sql) {
    app.get(url,  (req, res, next) => {
        db.query(sql).then( (response) => {
                stringify(response, {
                    formatters: {
                        date: (value) => {
                            return moment(value).format('YYYY-MM-DD');
                        }
                    },
                    header: true
                }, (err, output) => {
                    res.status(200).send(output);
                });
            },  (err) => {
                res.status(500).send(err);
            });
    })
}

const sqlList = {
     deviceMgt: {
         select: 'select * from device_management_test',
         update: 'update device_management_test set purchase_order=${purchase_order}, registration_date=${registration_date}, device_sn=${device_sn},  iccid=${iccid}, imei=${imei}, model_number=${model_number}, model_description=${model_description}, firmware_version=${firmware_version},manufacturer=${manufacturer}, points_to=${points_to}, use_zywie_sim=${use_zywie_sim}, sim_provider=${sim_provider}, zywie_logo=${zywie_logo}, wyless_provision_date=${wyless_provision_date}, device_test_date=${device_test_date},  device_suspension_date=${device_suspension_date}, status=${status}, location=${location}, checked_out_by=${checked_out_by}, checked_out_date=${checked_out_date}, checked_in_by=${checked_in_by}, checked_in_date=${checked_in_date}, salesteam=${salesteam}, salesperson_name=${salesperson_name}, enterprise_id=${enterprise_id}, parent_clinic=${parent_clinic}, sub_clinic=${sub_clinic}, physician=${physician}, billable=${billable}, lease=${lease}, lease_price_per_month=${lease_price_per_month}, lease_start_date=${lease_start_date}, lease_end_date=${lease_end_date} where device_sn=${device_sn}',
         insert: 'INSERT INTO public.device_management_test( purchase_order, registration_date, device_sn, iccid, imei, model_number, model_description, firmware_version, manufacturer, points_to,use_zywie_sim, sim_provider, zywie_logo, wyless_provision_date, device_test_date, device_suspension_date, status, location, checked_out_by,checked_out_date, checked_in_by, checked_in_date, salesteam, salesperson_name, enterprise_id, parent_clinic, sub_clinic, physician, billable, lease, lease_price_per_month, lease_start_date, lease_end_date) VALUES (${purchase_order}, ${registration_date}, ${device_sn}, ${iccid}, ${imei}, ${model_number}, ${model_description}, ${firmware_version}, ${manufacturer}, ${points_to}, ${use_zywie_sim}, ${sim_provider}, ${zywie_logo}, ${wyless_provision_date}, ${device_test_date}, ${device_suspension_date}, ${status}, ${location}, ${checked_out_by}, ${checked_out_date}, ${checked_in_by}, ${checked_in_date}, ${salesteam}, ${salesperson_name}, ${enterprise_id}, ${parent_clinic}, ${sub_clinic}, ${physician}, ${billable}, ${lease}, ${lease_price_per_month}, ${lease_start_date}, ${lease_end_date});',
         delete: 'delete  from device_management_test where device_sn=${device_sn};',
         getParentClinic: 'select parent_clinic from device_management_test where parent_clinic is not null group by parent_clinic',
         getSubClinic: 'select sub_clinic from device_management_test where sub_clinic is not null group by sub_clinic'
     },
    deviceHistory: {
        select: 'select * from device_history_test',
        update: 'UPDATE public.device_history_test SET row= ${row}, history_date= ${history_date}, device_sn= ${device_sn}, device_action= ${device_action}, by_whom= ${by_whom}, status= ${status}, device_owner= ${device_owner}, replace_device= ${replace_device}, replaced_device_sn= ${replaced_device_sn}, note=${note} where row=${row};',
        insert: 'insert into device_history_test (row, history_date, device_sn ,  device_action ,  by_whom, status ,  device_owner , replace_device , replaced_device_sn , note) values (${row}, ${history_date}, ${device_sn} ,  ${device_action} ,  ${by_whom}, ${status} ,  ${device_owner}, ${replace_device}, ${replaced_device_sn }, ${note});',
        delete: 'delete  from device_history_test where row=${row}'
    },
    deviceInventory: {
        select: 'select * from device_inventory_test',
        update: 'UPDATE public.device_inventory_test SET row=${row}, received_date=${received_date}, order_id=${order_id}, purchase_order=${purchase_order}, manufactuer=${manufactuer}, item=${item}, order_quantity=${order_quantity}, received_quantity=${received_quantity}, deficiency_quantity=${deficiency_quantity}, deficiency_received_date=${deficiency_received_date}, shipping_status=${shipping_status}, device_sn=${device_sn}, package_content=${package_content} WHERE row=${row};',
        insert: 'INSERT INTO public.device_inventory_test(row, received_date, order_id, purchase_order, manufactuer,item, order_quantity, received_quantity, deficiency_quantity, deficiency_received_date, shipping_status, device_sn, package_content) VALUES (${row}, ${received_date}, ${order_id}, ${purchase_order}, ${manufactuer}, ${item}, ${order_quantity}, ${received_quantity}, ${deficiency_quantity}, ${deficiency_received_date}, ${shipping_status}, ${device_sn}, ${package_content});',
        delete: 'delete from device_inventory_test where row=${row}'
     },
    accessoryInventory: {
        select: 'select * from accessory_inventory_test',
        update: 'UPDATE public.accessory_inventory_test  SET "row"=${row}, received_date=${received_date}, manufacturer_order_id=${manufacturer_order_id}, purchase_order=${purchase_order}, manufacturer=${manufacturer}, accessory=${accessory}, lot_no=${lot_no}, order_quantity=${order_quantity}, received_quantity=${received_quantity}, deficiency=${deficiency}, deficient_received_date=${deficient_received_date}, shipping_status=${shipping_status}, total_price=${total_price} WHERE row=${row};',
        insert: 'INSERT INTO public.accessory_inventory_test(  "row", received_date, manufacturer_order_id, purchase_order, manufacturer, accessory, lot_no, order_quantity, received_quantity, deficiency, deficient_received_date, shipping_status, total_price) VALUES (${row}, ${received_date}, ${manufacturer_order_id}, ${purchase_order}, ${manufacturer}, ${accessory}, ${lot_no}, ${order_quantity}, ${received_quantity},  ${deficiency}, ${deficient_received_date}, ${shipping_status}, ${total_price});',
        delete: 'delete from accessory_inventory_test where row=${row}'

    },
    dashboard:{
        orderSummary: 'select sum(order_quantity) as total_ordered_device, sum(received_quantity) as total_received_device, sum(deficiency_quantity) as total_deficiency_qty from device_inventory_test',
        totalDevices: 'select count(device_sn) from device_management_test',
        status: 'select status, count(status) from device_management_test group by status',
        location: 'select location, count(location) from device_management_test group by location',
        billable: 'select billable, count(billable) from device_management_test group by billable',
        purchaseOrder: 'select purchase_order, sum(order_quantity) as order_quantity, sum(received_quantity) as received_quantity, sum(deficiency_quantity) as deficiency_quantity from device_inventory_test group by purchase_order',
        parent_clinic: "select parent_clinic, count(device_sn) from device_management_test where parent_clinic is not null and billable='Y'  group by parent_clinic order by parent_clinic",
        sub_clinic: "select sub_clinic, count(device_sn) from device_management_test where parent_clinic ='Heart Smart, Inc' and billable='Y'  group by sub_clinic order by sub_clinic"
    }
};

 //////////in the device mgt page ///////////////////////////////////////////////////////////////////////
downloadData('/deviceMgt/download',sqlList.deviceMgt.select);
pgGetSqlUtilityFunc('/deviceMgt/get', sqlList.deviceMgt.select);
pgPostSqlUtilityFunc('/deviceMgt/update',  sqlList.deviceMgt.update);
pgPostSqlUtilityFunc('/deviceMgt/insert',  sqlList.deviceMgt.insert);
pgPostSqlUtilityFunc('/deviceMgt/delete',  sqlList.deviceMgt.delete);
// query and search
dynamicquerySqlUtilityFunc('/deviceMgt/filter', sqlList.deviceMgt.select);
// get device status and location
pgGetSqlUtilityFunc('/deviceMgt/get/parent_clinic',sqlList.deviceMgt.getParentClinic);
pgGetSqlUtilityFunc('/deviceMgt/get/sub_clinic',sqlList.deviceMgt.getSubClinic);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////device history page/////////////////////////////////////////////////////////////////////////////////////////////////////
pgGetSqlUtilityFunc('/deviceHistory/get', sqlList.deviceHistory.select);
pgPostSqlUtilityFunc('/deviceHistory/update',  sqlList.deviceHistory.update);
pgPostSqlUtilityFunc('/deviceHistory/insert',  sqlList.deviceHistory.insert);
pgPostSqlUtilityFunc('/deviceHistory/delete',  sqlList.deviceHistory.delete);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




//////////////////dashboard page/////////////////////////////////////////////////////////////////////////////////////////////////
pgGetSqlUtilityFunc('/dashboard/orderSummary', sqlList.orderSummary);
pgGetSqlUtilityFunc('/dashboard/totalDevices', sqlList.totalDevices);
pgGetSqlUtilityFunc('/dashboard/status', sqlList.status);
pgGetSqlUtilityFunc('/dashboard/location', sqlList.location);
pgGetSqlUtilityFunc('/dashboard/billable', sqlList.billable);
pgGetSqlUtilityFunc('/dashboard/purchaseOrder', sqlList.purchaseOrder);
pgGetSqlUtilityFunc('/dashboard/parent_clinic', sqlList.parent_clinic);
pgGetSqlUtilityFunc('/dashboard/sub_clinic', sqlList.sub_clinic);



// app.listen(3000);

module.exports = app;
