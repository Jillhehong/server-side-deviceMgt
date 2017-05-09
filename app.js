var config = {
    user: 'postgres', //env var: PGUSER
    database: 'todo', //env var: PGDATABASE
    password: null, //env var: PGPASSWORD
    host: 'localhost', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
};
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var csv = require('csv');
var pgp = require('pg-promise')({  }); // pg-promise module is to connect express to postgresql database
var db = pgp(config); //connect database with configuration
var stringify = require('csv-stringify');
var moment = require('moment');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// render index.html at the starting url
app.get('/', function (req, res) {
    res.sendfile('views/index.html');
});

//get data using pg-promise module
function pgGetSqlUtilityFunc(url, sql) {
    app.get(url, function(req, res, next){
        // if(req.isAuthenticated()){
        if(true){
            db.query(sql)
                .then(function (response) {
                    return res.json(response);
                }, function (err) {
                    return res.status(500).json(err);
                });
            pgp.end();
        }
        else {
            return  {error:'please log in'};
        }

    });
}
///post data using pg-promise module
function pgPostSqlUtilityFunc(url, sql) {
    app.post(url, function(req, res, next){
        // if(req.isAuthenticated()){
        if(true){
            console.log('query 1', sql);
            db.query(sql, req.body)
                .then(function (response) {
                    return res.json(response);
                }, function (err) {
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
    app.post(url, function(req, res, next){
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

            string  = sql + " where "+ arrays.join(' and ');
            console.log(string);
            db.query(string, req.body)
                .then(function(response ){
                    console.log('test');
                    return res.json(response);
                }, function(err){
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
    app.get(url, function (req, res, next) {
        db.query(sql).then(function (response) {
                stringify(response, {
                    formatters: {
                        date: function(value) {
                            return moment(value).format('YYYY-MM-DD');
                        }
                    },
                    header: true
                }, function(err, output){
                    res.status(200).send(output);
                });
            }, function (err) {
                res.status(500).send(err);
            });
    })
}

var sqlList = {
    select: {
        deviceMgt: 'select * from device_management_test',
        deviceHistory: 'select * from device_history_test',
        deviceInventory: 'select * from device_inventory_test',
        accessoryInventory: 'select * from accessory_inventory_test'
    },
    update: {
        deviceMgt: 'update device_management_test set purchase_order=${purchase_order}, registration_date=${registration_date}, device_sn=${device_sn},  iccid=${iccid}, imei=${imei}, model_number=${model_number}, model_description=${model_description}, firmware_version=${firmware_version},manufacturer=${manufacturer}, points_to=${points_to}, use_zywie_sim=${use_zywie_sim}, sim_provider=${sim_provider}, zywie_logo=${zywie_logo}, wyless_provision_date=${wyless_provision_date}, device_test_date=${device_test_date},  device_suspension_date=${device_suspension_date}, status=${status}, location=${location}, checked_out_by=${checked_out_by}, checked_out_date=${checked_out_date}, checked_in_by=${checked_in_by}, checked_in_date=${checked_in_date}, salesteam=${salesteam}, salesperson_name=${salesperson_name}, enterprise_id=${enterprise_id}, parent_clinic=${parent_clinic}, sub_clinic=${sub_clinic}, physician=${physician}, billable=${billable}, lease=${lease}, lease_price_per_month=${lease_price_per_month}, lease_start_date=${lease_start_date}, lease_end_date=${lease_end_date} where device_sn=${device_sn}',
        deviceHistory: 'UPDATE public.device_history_test SET row= ${row}, history_date= ${history_date}, device_sn= ${device_sn}, device_action= ${device_action}, by_whom= ${by_whom}, status= ${status}, device_owner= ${device_owner}, replace_device= ${replace_device}, replaced_device_sn= ${replaced_device_sn}, note=${note} where row=${row};',
        deviceInventory: 'UPDATE public.device_inventory_test SET row=${row}, received_date=${received_date}, order_id=${order_id}, purchase_order=${purchase_order}, manufactuer=${manufactuer}, item=${item}, order_quantity=${order_quantity}, received_quantity=${received_quantity}, deficiency_quantity=${deficiency_quantity}, deficiency_received_date=${deficiency_received_date}, shipping_status=${shipping_status}, device_sn=${device_sn}, package_content=${package_content} WHERE row=${row};',
        accessoryInventory: 'UPDATE public.accessory_inventory_test  SET "row"=${row}, received_date=${received_date}, manufacturer_order_id=${manufacturer_order_id}, purchase_order=${purchase_order}, manufacturer=${manufacturer}, accessory=${accessory}, lot_no=${lot_no}, order_quantity=${order_quantity}, received_quantity=${received_quantity}, deficiency=${deficiency}, deficient_received_date=${deficient_received_date}, shipping_status=${shipping_status}, total_price=${total_price} WHERE row=${row};'
    },
    insert: {
        deviceMgt: 'INSERT INTO public.device_management_test( purchase_order, registration_date, device_sn, iccid, imei, model_number, model_description, firmware_version, manufacturer, points_to,use_zywie_sim, sim_provider, zywie_logo, wyless_provision_date, device_test_date, device_suspension_date, status, location, checked_out_by,checked_out_date, checked_in_by, checked_in_date, salesteam, salesperson_name, enterprise_id, parent_clinic, sub_clinic, physician, billable, lease, lease_price_per_month, lease_start_date, lease_end_date) VALUES (${purchase_order}, ${registration_date}, ${device_sn}, ${iccid}, ${imei}, ${model_number}, ${model_description}, ${firmware_version}, ${manufacturer}, ${points_to}, ${use_zywie_sim}, ${sim_provider}, ${zywie_logo}, ${wyless_provision_date}, ${device_test_date}, ${device_suspension_date}, ${status}, ${location}, ${checked_out_by}, ${checked_out_date}, ${checked_in_by}, ${checked_in_date}, ${salesteam}, ${salesperson_name}, ${enterprise_id}, ${parent_clinic}, ${sub_clinic}, ${physician}, ${billable}, ${lease}, ${lease_price_per_month}, ${lease_start_date}, ${lease_end_date});',
        deviceHistory: 'insert into device_history_test (row, history_date, device_sn ,  device_action ,  by_whom, status ,  device_owner , replace_device , replaced_device_sn , note) values (${row}, ${history_date}, ${device_sn} ,  ${device_action} ,  ${by_whom}, ${status} ,  ${device_owner}, ${replace_device}, ${replaced_device_sn }, ${note});',
        deviceInventory: 'INSERT INTO public.device_inventory_test(row, received_date, order_id, purchase_order, manufactuer,item, order_quantity, received_quantity, deficiency_quantity, deficiency_received_date, shipping_status, device_sn, package_content) VALUES (${row}, ${received_date}, ${order_id}, ${purchase_order}, ${manufactuer}, ${item}, ${order_quantity}, ${received_quantity}, ${deficiency_quantity}, ${deficiency_received_date}, ${shipping_status}, ${device_sn}, ${package_content});',
        accessoryInventory: 'INSERT INTO public.accessory_inventory_test(  "row", received_date, manufacturer_order_id, purchase_order, manufacturer, accessory, lot_no, order_quantity, received_quantity, deficiency, deficient_received_date, shipping_status, total_price) VALUES (${row}, ${received_date}, ${manufacturer_order_id}, ${purchase_order}, ${manufacturer}, ${accessory}, ${lot_no}, ${order_quantity}, ${received_quantity},  ${deficiency}, ${deficient_received_date}, ${shipping_status}, ${total_price});'
    },
    delete: {
        deviceMgt: 'delete  from device_management_test where device_sn=${device_sn};',
        deviceHistory: 'delete  from device_history_test where row=${row}',
        deviceInventory: 'delete from device_inventory_test where row=${row}',
        accessoryInventory: 'delete from accessory_inventory_test where row=${row}'
    }
};

 //////////in the device management page ///////////////////////////////////////////////////////////////////////
// download data
downloadData('/deviceMgt',sqlList.select.deviceMgt);
// select data
pgGetSqlUtilityFunc('/get', sqlList.select.deviceMgt);
//update data
pgPostSqlUtilityFunc('/post',  sqlList.update.deviceMgt);
// insert data
pgPostSqlUtilityFunc('/post',  sqlList.insert.deviceMgt);
// delete data
pgPostSqlUtilityFunc('/post',  sqlList.delete.deviceMgt);
// query and search
dynamicquerySqlUtilityFunc('/search', sqlList.select.deviceMgt);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////








module.exports = app;
