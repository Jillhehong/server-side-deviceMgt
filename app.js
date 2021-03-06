const config = {
    user: 'postgres', //env var: PGUSER
    database: 'todo', //env var: PGDATABASE
    password: null, //env var: PGPASSWORD
    host: 'localhost', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
};
// const config = 'postgres://zacctzciijrgmz:980809143172c8da47626cf0d984b2a61001c1843f03cca92c8e922a1b024a73@ec2-54-197-230-161.compute-1.amazonaws.com:5432/de7c28knkau6h7';
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
const passport = require('passport'); //passport.js
// passport-local lets you authenticate using a username and password in your Node.js applications.
const LocalStrategy = require('passport-local').Strategy;
// express-session create a session middleware in express
const session = require('express-session'); //manage user session property
const bcrypt = require('bcrypt'); //bcrypt module is used to encrypt password stored in database

const app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use(session({
    secret: 'd3kfd20g83jlvn27c04cke037gfjp',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// serialize
passport.serializeUser(function(user, done) {
    done(null, user);
});
//deserialize
passport.deserializeUser(function(user, done) {
    done(null, user);
});


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
 function dynamicquerySqlUtilityFuncDeviceMgt(url, sql) {

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
function dynamicquerySqlUtilityFuncDeviceHistory(url, sql) {
     app.post(url, (req, res, next) => {
         // if(req.isAuthenticated()){
         if(true){
             const string = Object.keys(req.body)[0];      // get object key
             const value = req.body[string];      // get object value // do not use Object.values(. It is not well supported in browser
             var newSql = '';
             if(value) {
                  newSql = sql + ' where '+ string + '=${' + string + '}';
             } else {
                  newSql = sql;
             }
             db.query(newSql, req.body)
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
     })
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
         getSubClinic: 'select sub_clinic from device_management_test where sub_clinic is not null group by sub_clinic',
         getCustomers: "select parent_clinic, count(device_sn) as totaldevices from device_management_test where parent_clinic is not null and billable = 'Y' group by parent_clinic order by parent_clinic;"
     },
    deviceHistory: {
        select: 'select * from device_history_test',
        update: 'UPDATE public.device_history_test SET row= ${row}, history_date= ${history_date}, device_sn= ${device_sn}, device_action= ${device_action}, by_whom= ${by_whom}, status= ${status}, device_owner= ${device_owner}, replace_device= ${replace_device}, replaced_device_sn= ${replaced_device_sn}, note=${note} where row=${row};',
        insert: 'insert into device_history_test (row, history_date, device_sn ,  device_action ,  by_whom, status ,  device_owner , replace_device , replaced_device_sn , note) values (${row}, ${history_date}, ${device_sn} ,  ${device_action} ,  ${by_whom}, ${status} ,  ${device_owner}, ${replace_device}, ${replaced_device_sn }, ${note});',
        delete: 'delete  from device_history_test where row=${row}',
        getDeviceOnwer: 'select device_owner from device_history_test where device_owner is not null group by device_owner'
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
        orderSummary: 'select sum(order_quantity) as total_ordered_qty, sum(received_quantity) as total_received_qty, sum(deficiency_quantity) as total_deficiency_qty from device_inventory_test',
        totalDevices: 'select count(device_sn) from device_management_test where device_sn is not null',
        status: 'select status, count(status) from device_management_test where status is not null group by status',
        location: 'select location, count(location) from device_management_test where location is not null group by location',
        billable: 'select billable, count(billable) from device_management_test where billable is not null group by billable',
        purchaseOrder: 'select purchase_order, sum(order_quantity) as order_quantity, sum(received_quantity) as received_quantity, sum(deficiency_quantity) as deficiency_quantity from device_inventory_test where purchase_order is not null group by purchase_order',
        parent_clinic: "select parent_clinic, count(device_sn) from device_management_test where parent_clinic is not null and billable='Y'  group by parent_clinic order by parent_clinic",
        sub_clinic: "select sub_clinic, count(device_sn) from device_management_test where parent_clinic ='Heart Smart, Inc' and billable='Y'  group by sub_clinic order by sub_clinic"
    },
    signup: {
         add: 'INSERT INTO public.users(first_name, last_name, email, password) VALUES (${first_name}, ${last_name}, ${email}, ${password})'
    }
};

 //////////in the device mgt page ///////////////////////////////////////////////////////////////////////
downloadData('/deviceMgt/download',sqlList.deviceMgt.select);
pgGetSqlUtilityFunc('/deviceMgt/get', sqlList.deviceMgt.select);
pgPostSqlUtilityFunc('/deviceMgt/update',  sqlList.deviceMgt.update);
pgPostSqlUtilityFunc('/deviceMgt/insert',  sqlList.deviceMgt.insert);
pgPostSqlUtilityFunc('/deviceMgt/delete',  sqlList.deviceMgt.delete);
// query and search
dynamicquerySqlUtilityFuncDeviceMgt('/deviceMgt/filter', sqlList.deviceMgt.select);
// get device status and location
pgGetSqlUtilityFunc('/deviceMgt/get/parent_clinic',sqlList.deviceMgt.getParentClinic);
pgGetSqlUtilityFunc('/deviceMgt/get/sub_clinic',sqlList.deviceMgt.getSubClinic);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////device history page/////////////////////////////////////////////////////////////////////////////////////////////////////
pgGetSqlUtilityFunc('/deviceHistory/get', sqlList.deviceHistory.select);
pgPostSqlUtilityFunc('/deviceHistory/update',  sqlList.deviceHistory.update);
pgPostSqlUtilityFunc('/deviceHistory/insert',  sqlList.deviceHistory.insert);
pgPostSqlUtilityFunc('/deviceHistory/delete',  sqlList.deviceHistory.delete);
pgGetSqlUtilityFunc('/deviceHistory/get/deviceOwner',  sqlList.deviceHistory.getDeviceOnwer);
dynamicquerySqlUtilityFuncDeviceHistory('/deviceHistory/search', sqlList.deviceHistory.select);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////customer mgt//////////////////////////////////////////////////////////////////////////////////////////
pgGetSqlUtilityFunc('/customerMgt/get', sqlList.deviceMgt.getCustomers);


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////dashboard page/////////////////////////////////////////////////////////////////////////////////////////////////
pgGetSqlUtilityFunc('/dashboard/orderSummary', sqlList.dashboard.orderSummary);
pgGetSqlUtilityFunc('/dashboard/totalDevices', sqlList.dashboard.totalDevices);
pgGetSqlUtilityFunc('/dashboard/status', sqlList.dashboard.status);
pgGetSqlUtilityFunc('/dashboard/location', sqlList.dashboard.location);
pgGetSqlUtilityFunc('/dashboard/billable', sqlList.dashboard.billable);
pgGetSqlUtilityFunc('/dashboard/purchaseOrder', sqlList.dashboard.purchaseOrder);
pgGetSqlUtilityFunc('/dashboard/parentClinic', sqlList.dashboard.parent_clinic);
pgGetSqlUtilityFunc('/dashboard/subClinic', sqlList.dashboard.sub_clinic);

///////////////////////////////sign up//////////////////////////////////////////////////////////////////////////////////////
// encrypt password util func
function hashSqlUtilityFunc(url, sql) {
    app.post(url, function(req, res, next){
        //hash password
        var hash = bcrypt.hashSync(req.body.password, 9);
        req.body.password = hash;
        db.query(sql, req.body)
            .then( (response) => {
                return res.json(response);
                },  (err) => {
                return res.status(500).json(err);
            });
        pgp.end();
    });
}
hashSqlUtilityFunc('/addNewUsers', sqlList.signup.add);
/////////////////////////////////////////login////////////////////////////////////////////////////////////////////////////
//authenticate log in
passport.use( 'local', new LocalStrategy(
    (username, password, done) => {
        /// query username and password from the users table
        db.query('select email, password from public.users').then((data) => {
            data.map( (item) => {
                //correct user and password
                if(item.email == username && bcrypt.compareSync(password, item.password) ) {
                    var user = {
                        username: username,
                        password: item.password
                    };
                    return done(null, user);
                }
                //user exists, but wrong password
                else if(item.email == username && !bcrypt.compareSync(password, item.password)){
                    /*If the credentials are not valid (for example, if the password is incorrect),
                     done should be invoked with false instead of a user to indicate an authentication failure.
                     */
                    return done(null, false, { message: 'Incorrect password.'});
                }
            });
            //user does not exist
            return done(null, false, {message: "User doesn't exist"});
        }, err => done(err));
    }
));
app.post('/authenticateUser', passport.authenticate('local'), function (req, res) {
    if(req.user){return res.json(req.user)}
});
///////////////////////////////////log out//////////////////////////////////////////////////////////////////////////////////
app.get("/logout", (req, res) => {
    req.session.destroy(  (err) => {  res.end() });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = app;
