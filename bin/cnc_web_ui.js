// ********************************************************************************************************************************************************
//
// cnc_web_ui.js
//
// The Monitoring Shop & Chronosphere - University Labs Generator Command and Control Web UI
//
// Version History
//
// Version	Date		Author		Description
// 0.0.0	20230914	Bill Fox	Draft - in development
// ********************************************************************************************************************************************************

// ********************************************************************************************************************************************************
// Setup
// ********************************************************************************************************************************************************
var ver = '0.0.0';

var props = require('properties-reader');
var protocol;
var fs = require('fs');
const qs = require('querystring');
const { v4: uuidv4 } = require('uuid');
const crypto = require("crypto");
var HashMap = require('hashmap');
var url = require('url');
var calling_http = require('http');
var calling_https = require('https');
var os = require('os');

console.log("** cnc_web_ui **");
console.log("");

var os_platform = os.platform + ' ' + os.release ;

// ** Properties File **

var config_file = "../conf/cnc_web_ui.properties";

if(!fs.existsSync(config_file))
{
	console.error("ERROR: Config File " + config_file + " Not Found!");
	process.exit(-1);
}
	
var config = props(config_file);

var tls_enabled = config.get("tls_enabled");
var listen_port = config.get("listen_port");
var listen_address = config.get("listen_address");
var tls_cert = config.get("tls_cert");
var tls_private_key = config.get("tls_private_key");
var inactivity_timeout = config.get("inactivity_timeout");
var anon_allow = config.get("anon_allow");
var anon_rbac = config.get("anon_rbac");
var static_allow_file = config.get("static_allow");

var log_location = config.get("log_location");
var log_filename = config.get("log_filename");
var log_max_size = config.get("log_max_size");
var log_num_retain = config.get("log_num_retain");
var log_level = config.get("log_level");

var cases_file = config.get("cases");

var dev_mode = config.get("dev_mode");


// ** Set Up Logging **

var log4js = require("log4js");
const { exit } = require('process');

log4js.configure(
{
	appenders: 
	{
	  main: { type: 'file', filename: log_location + '/' + log_filename, maxLogSize: log_max_size, backups: log_num_retain, compress: false },
	  stdout: { type: 'stdout' }
	},
	categories: 
	{
	  default: { appenders: [ 'main', 'stdout' ], level: log_level}
	}
});
  

var logger = log4js.getLogger("main");

logger.info("*****************************************");
logger.info("** STARTING cnc_web_ui - Version " + ver + " **");
logger.info("*****************************************");

logger.info("Properties Read...");
logger.info("|");
logger.info("+-->tls_enabled = " + tls_enabled);
logger.info("+-->listen_port = " + listen_port);
logger.info("+-->listen_address = " + listen_address);
logger.info("+-->tls_cert = " + tls_cert);
logger.info("+-->tls_private_key = " + tls_private_key);
logger.info("+-->inactivity_timeout = " + inactivity_timeout);
logger.info("+-->anon_allow = " + anon_allow);
logger.info("+-->anon_rbac = " + anon_rbac);


var static_allow = {};
var cases = {};

logger.info("+-->cases = " + cases_file);

try
{
    cases = JSON.parse(fs.readFileSync(cases_file));
}
catch(e)
{
    logger.fatal(e);
    logger.fatal("Failed to read use case config file " + cases_file + ". We can't run without this, so exiting now.");
    exit(1);
}

logger.trace("   |");
for(let inc_case = 0; inc_case < cases.cases.length; inc_case ++)
{
    logger.trace("   +-->" + cases.cases[inc_case].id + " - " + cases.cases[inc_case].name + " - " + cases.cases[inc_case].desc);
}

logger.info("+-->static_allow = " + static_allow_file);

try
{
    static_allow = JSON.parse(fs.readFileSync(static_allow_file));
}
catch(e)
{
    logger.warn(e);
    logger.warn("Failed to read static allow file " + static_allow_file + ". **WITHOUT THIS FILE, ALL STATIC CONTENT WILL BECOME PUBLICALLY ACCESSIBLE!**");
    static_allow = {};
}

var allow_obj = new HashMap();

logger.trace("   |");
for(let inc_obj = 0; inc_obj < static_allow.objects.length; inc_obj ++)
{
    logger.trace("   +-->" + static_allow.objects[inc_obj].url + " - " + static_allow.objects[inc_obj].type);
    allow_obj.set(static_allow.objects[inc_obj].url, static_allow.objects[inc_obj].type);
}

logger.info("+-->dev_mode = " + dev_mode);


var options = {};

if(tls_enabled)
{
	protocol = require('https');
	options = {
	  key: fs.readFileSync(tls_private_key),
	  cert: fs.readFileSync(tls_cert),
	  localAddress: listen_address
	};
}
else
{
	protocol = require('http');
	options = {
	  localAddress: listen_address
	};
}

// Store for session IDs
// NOTE: For simplicity, we'll just store the session IDs in memory for now. 
//       In future versions, if we plan to run multiple instances of this service, we will have to have some sort of shared storage.
var session_ids = new HashMap();    // Key on session ID, with user as value
var user_session = new HashMap();   // Key on Username, with session ID as value
var session_timestamp = new HashMap(); // key on session ID, with epoch timestamp of when session was created (used for session time out - TODO)

// Javascript store

var lib_store = new HashMap();
load_lib();
var tplib_store = new HashMap();
load_tplib();

// Image Store (all in memory for now, so we have to be careful about size.)

var image_store = new HashMap();
load_images();

// CSS Store

var css_store = new HashMap();
load_css();

// HTML Store

var html_store = new HashMap();
load_html();

// Font Store

var font_store = new HashMap();
load_fonts();



// ********************************************************************************************************************************************************
// Functions
// ********************************************************************************************************************************************************

// ** load_images - load all base images from filesystem into memory based image store

function load_images()
{
    logger.trace("");
    logger.trace("Loading Static Images into Memory...");
    logger.trace("|");

    let img_dir = '../images';

    let dir = fs.opendirSync(img_dir);
    let dirent;
    while ((dirent = dir.readSync()) !== null) 
    {
        if(dirent.isFile() && dirent.name != 'readme')
        {
            logger.trace("+-->" + dirent.name);
            image_store.set(dirent.name,fs.readFileSync(img_dir + '/' + dirent.name));
        }
    }
    dir.closeSync();
}

// ** load_css - load all style sheets from filesystem into memory based css store

function load_css()
{
    logger.trace("");
    logger.trace("Loading Static css into Memory...");
    logger.trace("|");

    let css_dir = '../css';

    let dir = fs.opendirSync(css_dir);
    let dirent;
    while ((dirent = dir.readSync()) !== null) 
    {
        if(dirent.isFile() && dirent.name != 'readme')
        {
            logger.trace("+-->" + dirent.name);
            css_store.set(dirent.name,fs.readFileSync(css_dir + '/' + dirent.name).toString());
        }
    }
    dir.closeSync();
}

// ** load_html - load all html from filesystem into memory based html store

function load_html()
{
    logger.trace("");
    logger.trace("Loading Static html into Memory...");
    logger.trace("|");

    let html_dir = '../html';

    let dir = fs.opendirSync(html_dir);
    let dirent;
    while ((dirent = dir.readSync()) !== null) 
    {
        if(dirent.isFile() && dirent.name != 'readme')
        {
            logger.trace("+-->" + dirent.name);
            html_store.set(dirent.name,fs.readFileSync(html_dir + '/' + dirent.name).toString());
        }
    }
    dir.closeSync();
}

function load_fonts()
{
    logger.trace("");
    logger.trace("Loading Fonts into Memory...");
    logger.trace("|");

    let fonts_dir = '../fonts';

    let dir = fs.opendirSync(fonts_dir);
    let dirent;
    while ((dirent = dir.readSync()) !== null) 
    {
        if(dirent.isFile() && dirent.name != 'readme')
        {
            logger.trace("+-->" + dirent.name);
            font_store.set(dirent.name,fs.readFileSync(fonts_dir + '/' + dirent.name));
        }
    }
    dir.closeSync();
}

// ** load_lib - load all internal js from filesystem into memory

function load_lib()
{
    logger.trace("");
    logger.trace("Loading js libraries into Memory...");
    logger.trace("|");

    let lib_dir = '../lib';

    let dir = fs.opendirSync(lib_dir);
    let dirent;
    while ((dirent = dir.readSync()) !== null) 
    {
        if(dirent.isFile() && dirent.name != 'readme' && dirent.name.endsWith('.ttf'))
        {
            logger.trace("+-->" + dirent.name);
            lib_store.set(dirent.name,fs.readFileSync(lib_dir + '/' + dirent.name).toString());
        }
    }
    dir.closeSync();
}

// ** load_tplib - load all third party js from filesystem into memory

function load_tplib()
{
    logger.trace("");
    logger.trace("Loading third party js libraries into Memory...");
    logger.trace("|");

    let tplib_dir = '../tplib';

    let dir = fs.opendirSync(tplib_dir);
    let dirent;
    while ((dirent = dir.readSync()) !== null) 
    {
        if(dirent.isFile() && dirent.name != 'readme')
        {
            logger.trace("+-->" + dirent.name);
            tplib_store.set(dirent.name,fs.readFileSync(tplib_dir + '/' + dirent.name).toString());
        }
    }
    dir.closeSync();
}

// ********************************************************************************************************************************************************
// Server Actions
// ********************************************************************************************************************************************************

// serve_html - Serve static html
/*
async function serve_html(html, res, client_id, this_session_id)
{

    let chcksess = await check_session(client_id, this_session_id);
    let session_valid = chcksess.vaild || false;
    let this_user = chcksess.username || '';

    if(!session_valid)
    {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Not Found</p></body></html>');
        res.end();

    }
    else if(html == null)
    {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Not Found</p></body></html>');
        res.end();
    }
    else
    {
        res.writeHead(200, { 'Content-Type': 'text/html'});
        res.end(html);
    }
}
*/

// serve_static - Serve a static object (such as html, css etc)

async function serve_static(action, res, client_id, this_session_id)
{

    let chcksess = await check_session(client_id, this_session_id);
    let session_valid = chcksess.vaild || false;
    let this_user = chcksess.username || '';

    //let segments = action.split('/');
    let ok_2_serve = false;

    if(!session_valid)
    {
        // We don't have a valid session. 
        //  If the request is in the static allow list, serve it.
        //  If the request is something sensible (such as /, index.html etc), serve the login page
        //  Else, serve them a 404.


        if(allow_obj.has(action))
        {
            ok_2_serve = true;
        }
        else if(action == "/html/home.html")
        {
            action = "/html/login/html";
            ok_2_serve = true;
        }
        else
        {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<html><body><p>Not Found</p></body></html>');
            res.end();
        }

    }
    else
    {
        ok_2_serve = true;  // We have a valid session, so it's OK to serve the requested object
    }

    if(ok_2_serve) 
    {

        if (action.startsWith('/html/'))
        {     
            // ** Serve any static html **

            if(dev_mode) load_html();
            
            let html_name = action.slice(6);
            let html = html_store.get(html_name);

            if(html == null)
            {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.write('<html><body><p>Not Found</p></body></html>');
                res.end();
            }
            else
            {
                res.writeHead(200, { 'Content-Type': 'text/html'});
                res.end(html);
            }
        }

        if (action.startsWith('/images/'))
        {     
            // ** Serve any static images **

            if(dev_mode) load_images();
            
            let image_name = action.slice(8);
            let image = image_store.get(image_name);

            if(image == null)
            {
                image = fnf_image;
                image_name = fnf_image_name;
            }
            let mime_type = image_name.slice(image_name.lastIndexOf('.') + 1);

            res.writeHead(200, { 'Content-Type': 'image/' + mime_type });
            res.end(image);
        }
        else if (action.startsWith('/fonts/'))
        {     
            // ** Serve and fonts **

            if(dev_mode) load_fonts();
            
            let font_name = action.slice(7);
            let font = font_store.get(font_name);

            if(font == null)
            {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.write('<html><body><p>Not Found</p></body></html>');
                res.end();
            }
            let mime_type = 'x-font-ttf';

            res.writeHead(200, { 'Content-Type': 'application/' + mime_type });
            res.end(font);
        }
        else if (action.startsWith('/css/'))
        {     
            // ** Serve any static css **

            if(dev_mode) load_css();
            
            let css_name = action.slice(5);
            let css = css_store.get(css_name);

            if(css == null)
            {
                res.writeHead(404, { 'Content-Type': 'text/css' });
                res.end();
            }
            else
            {
                res.writeHead(200, { 'Content-Type': 'text/css'});
                res.end(css);
            }
        }
        else if (action.startsWith('/lib/'))
        {     
            // ** Serve any Internal JS **

            if(dev_mode) load_lib();
            
            let lib_name = action.slice(5);
            let lib = lib_store.get(lib_name);

            if(lib == null)
            {
                res.writeHead(404, { 'Content-Type': 'text/javascript' });
                res.end();
            }
            else
            {
                res.writeHead(200, { 'Content-Type': 'text/javascript'});
                res.end(tplib);
            }
        }
        else if (action.startsWith('/tplib/'))
        {     
            // ** Serve any Third Pary JS **

            if(dev_mode) load_tplib();
            
            let tplib_name = action.slice(7);
            let tplib = tplib_store.get(tplib_name);

            if(tplib == null)
            {
                res.writeHead(404, { 'Content-Type': 'text/javascript' });
                res.end();
            }
            else
            {
                res.writeHead(200, { 'Content-Type': 'text/javascript'});
                res.end(tplib);
            }
        }
    }

}

// ********************************************************************************************************************************************************
// Utility Functions
// ********************************************************************************************************************************************************

function escapeRegExp(str) 
{
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}


// ********************************************************************************************************************************************************
// User and Session Handling
// ********************************************************************************************************************************************************

// check_password - check a given password matches a hashed password

function check_password(password, salt, saltiness, hashed_password) 
{
    let hash = crypto.pbkdf2Sync(password, salt, saltiness, 512, 'sha512').toString('base64');

    if(hashed_password == hash)
    {
        return(true);
    }
    else
    {
        return(false);
    }
}

// check_session - check requesting client has a valid session


async function check_session(client_id, session_id)
{

    return new Promise(async function(resolve) 
    {

        // TODO: For now, just return true

        resolve({vaild: true, username: "guest"});

        /*

        logger.debug(client_id + ' - Checking session id of ' + session_id + ' is valid...');

        let session_valid = false;
        let the_user = 'guest';

        let check_session_json = {   auth: couchbase_api.auth, 
                                bucket: "tmsd-session",
                                key: session_id,
                                expire: inactivity_timeout
                            };

        let couchbase_check_session = await call_couchbase_dh('/getbykey', check_session_json );

        if(couchbase_check_session.hasOwnProperty('error'))
        {
            if(couchbase_check_session.error == 'Error: document not found')
            {

                logger.debug(client_id + ' - Session ID ' + session_id + ' is NOT valid! Rejecting client request.' );

            }
            else
            {
                logger.error(client_id + ' - Unable to verify if Session ID ' + session_id + ' is valid: ' + couchbase_check_session.error);
            }
        }
        else if(couchbase_check_session.hasOwnProperty('username'))
        {
            let client_info = couchbase_check_session.client_info || 'unknown';

            if(client_info == client_id)
            {
                logger.debug(client_id + ' - Session ID ' + session_id + ' is valid for user "' + couchbase_check_session.username + '"');
                session_valid = true;
                the_user = couchbase_check_session.username;

            }
            else
            {
                logger.debug(client_id + ' - Session ID ' + session_id + ' is NOT valid! The client ID does not match the client info we have on record. Rejecting client request.' );

            }

        }
        else
        {
            logger.error(client_id + ' - Unable to verify if Session ID ' + session_id + ' is valid. Malformed Response from Data Handler: ' + couchbase_check_session);

        }


        let result = {vaild: session_valid, username: the_user};

        resolve(result);

        */

    }).catch((error) => 
    {
        logger.error(error);
    });


}


// ** action_on_invalid_session - Decided what to do with an invalid session. 
//      - If anon_allow is false, present the user with a login screen.
//      - If anon_allow is true, create a guest session
/* 
async function action_on_invalid_session(res, client_id, action, err_msg)
{
    return new Promise(async function(resolve) 
    {
        // TODO - For now, action is always 'login_guest'

        resolve('login_guest');



        if(reload_on_refresh)
        {
            reload();
        }

        if(anon_allow)
        {

            // Anonymous access is allowed - let's create a 'guest' session.

            let session_id = uuidv4(); 
            let login_user = "guest";

            let cre_sess = {

                auth: couchbase_api.auth, 
                bucket: "tmsd-session", 
                key: session_id,
                expire: inactivity_timeout,
                doc: {
                    username: login_user,
                    client_info: client_id
                }

            }

            let cre_sess_result = await call_couchbase_dh('/upsertbykey', cre_sess);

            if(cre_sess_result.hasOwnProperty('error'))
            {
                logger.error(client_id + ' - User "' + login_user + '. Failed to generate session id record ' + session_id + ' in data store! Error is: ' + error);

                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.write('<html><body><p>Error:</p>' + error + '</body></html>');
                res.end();
                
            }
            else
            {
                logger.info(client_id + ' - User "' + login_user + '" logged in successfully. Assigned Session ID: ' + session_id);

                let headers = {
                        'Content-Type': 'text/html',
                        'Set-Cookie': 'sessionId=' + session_id + '; SameSite=Strict' };
                
                let this_redirect = replaceAll(redirect_page, '{{redirect}}', action);
                res.writeHead(200, headers);   
                res.end(this_redirect);
            }

            resolve('login_guest');
        }
        else
        {
            // Anonymous access is not allowed - Show the user a login page

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(login_page.replace('{{redirect}}', action).replace('{{err_msg}}', err_msg));

            resolve('login_required');
        }


    }).catch((error) => 
    {
        logger.error(error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Error:</p>' + error + '</body></html>');
        res.end();
    });

}

*/

// ** action_login - Action a user's login

async function action_login(res, client_id, body)
{
    return new Promise(async function(resolve) 
    {

        let err_msg = '';

        let session_id = 'none';

        let payload = qs.parse(body);
        let login_user = payload.user || '';
        let login_pass = payload.pass || '';
        let redirect_path = payload.redirect;

        logger.debug(client_id + ' requested login as user ' + login_user);

        /*

        let get_user_request = {

            auth: couchbase_api.auth, 
            bucket: "tmsd-users", 
            key: login_user

        }
        */

        let p_correct = false;
        let check_user_exists = false;

        let check_user = 'false';

        if(login_pass == '' || login_user == '')
        {
            logger.debug(client_id + ' - Unable to log user "' + login_user + '" in. Reason is: User or Password fields have been left blank.');
            err_msg = 'Incorrect Username/Password combination. Please try again.';
        }
        else
        {
            check_user = await call_couchbase_dh('/existsbykey', get_user_request);

            if(check_user.hasOwnProperty('error'))
            {
                let check_error = check_user.error;
                logger.debug(client_id + ' - Unable to check if user "' + login_user + '" exists. Reason is: ' + check_error);
                err_msg = 'There seems to be a technical issue. Please try again later.';
            }
            else
            {
                try
                {
                    check_user_exists = check_user.exists;
                    if(check_user_exists == 'false')
                    {
                        logger.debug(client_id + ' - Unable to log user "' + login_user + '" in. Reason is: User Does Not Exist!');
                        err_msg = 'Incorrect Username/Password combination. Please try again.';
                    }
                }
                catch (error)
                {
                    logger.error(client_id + ' - Error checking if user "' + login_user + '" exist: ' + error);
                    check_user_exists = false;
                    err_msg = 'There seems to be a technical issue. Please try again later.';
                }
            }
        }

        if(check_user_exists == 'true')
        {

            let get_user = await call_couchbase_dh('/getbykey', get_user_request);

            if(get_user.hasOwnProperty('error'))
            {
                let login_error = get_user.error;

                err_msg = 'There seems to be a technical issue. Please try again later.';

                if(login_error == "Error: document not found")
                {
                    login_error = 'User Does Not Exist!';
                    err_msg = 'Incorrect Username/Password combination. Please try again.';
                }

                logger.debug(client_id + ' - Unable to log user "' + login_user + '" in. Reason is: ' + login_error);
            }
            else
            {
                try
                {
                    p_correct = check_password(login_pass, get_user.salt, get_user.saltiness, get_user.password);

                    if(!p_correct)
                    {
                        logger.debug(client_id + ' - User "' + login_user + '" gave incorrect password.');
                        err_msg = 'Incorrect Username/Password combination. Please try again.';
                    }
                    else
                    {
                        // Create Session

                        session_id = uuidv4();  

                        let cre_sess = {

                            auth: couchbase_api.auth, 
                            bucket: "tmsd-session", 
                            key: session_id,
                            expire: inactivity_timeout,
                            doc: {
                                username: login_user,
                                client_info: client_id
                            }
        
                        }

                        let cre_sess_result = await call_couchbase_dh('/upsertbykey', cre_sess);

                        if(cre_sess_result.hasOwnProperty('error'))
                        {
                            logger.error(client_id + ' - User "' + login_user + '. Failed to generate session id record ' + session_id + ' in data store! Error is: ' + error);
                            p_correct = false;
                            err_msg = 'There seems to be a technical issue. Please try again later.';
                        }
                        else
                        {
                            logger.info(client_id + ' - User "' + login_user + '" logged in successfully. Assigned Session ID: ' + session_id);
                        }
                        
                    }
                }
                catch (error)
                {
                    logger.error(client_id + ' - Password check for user "' + login_user + '" returned error: ' + error);
                    err_msg = 'There seems to be a technical issue. Please try again later.';
                }
            }

        }

        let headers;

        if(p_correct)
        {
            headers = {
                'Content-Type': 'text/html',
                'Set-Cookie': 'sessionId=' + session_id + '; SameSite=Strict'
            }; 

            let this_redirect = replaceAll(redirect_page, '{{redirect}}', redirect_path);
            res.writeHead(200, headers); 
            res.end(this_redirect);
    
        }
        else
        {

           action_on_invalid_session(res, client_id, redirect_path, err_msg);
        }


       resolve(true);


    }).catch((error) => 
    {
        logger.error(error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Error:</p>' + error + '</body></html>');
        res.end();
    });
}

// action_logout - Action a user logout request

async function action_logout(res, action, client_id, this_session_id)
{
    return new Promise(async function(resolve) 
    {

        let kill_sess_result = '{}';

        /*
        let session_valid = false;

        let chcksess = await check_session(client_id, this_session_id);
        session_valid = chcksess.vaild || false;
        let user2logout = chcksess.username || '';

        // If user not a guest user, delete the session from the data store

        if(!anon_allow && user2logout != 'guest')
        {

            let kill_sess = {

                auth: couchbase_api.auth, 
                bucket: "tmsd-session", 
                key: this_session_id
            }

            kill_sess_result = await call_couchbase_dh('/removebykey', kill_sess);

            logger.info(client_id + ' - User "' + user2logout + '" logged out successfully. Session ID: ' + this_session_id + ' removed from data store.');
        }



        // Now call 'action_on_invalid_session' - If not a guest user, this should fail through to the login page.

        action_on_invalid_session(res, client_id, '/', ''); 
        
        */

        resolve(kill_sess_result);
        
    }).catch((error) => 
    {
        logger.error(error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Error:</p>' + error + '</body></html>');
        res.end();
    });

}

// ** serve_home - Serve Home Page, or redirect to login page if applicable
/*
async function serve_home(res, action, client_id, this_session_id)
{
    return new Promise(async function(resolve) 
    {
        

        if(reload_on_refresh)
        {
            reload();
        }

        let session_valid = false;

        let chcksess = await check_session(client_id, this_session_id);
        session_valid = chcksess.vaild || false;
        let home_user = chcksess.username || '';

        if(!session_valid)
        {
            // Not a valid session, so we'll either present user with login page, or create a session if anon_allow is true.

           action_on_invalid_session(res, client_id, action, '');

        }
        else
        {
            // Display the home page

            logger.debug(client_id + ' being served the home page.');

            let dash_list = '';

            dashboard_store.forEach(function(dash, dash_name) 
            {
                let link = '<a href="/tmsd/' + dash_name + '"><img src="/tmsd/' + dash_name + '/images/menu-icon.png" style="width:100px;height:100px;"></a>';
                dash_list = dash_list + '<tr><td>' + link + '</td><td>' + dash_name + '</td></tr>';
            });

            let home_page_built = replaceAll(home_page.replace('{{dash_list}}', dash_list), '{{username}}', home_user);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(home_page_built);
        }

        

        let html = html_store.get("home.html");

        if(html == null)
        {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<html><body><p>Not Found</p></body></html>');
            res.end();
        }
        else
        {
 		    res.writeHead(200, { 'Content-Type': 'text/html'});
            res.end(html);
        }

        resolve(true);


    }).catch((error) => 
    {
        logger.error(error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Error:</p>' + error + '</body></html>');
        res.end();
    });
}

*/

// ********************************************************************************************************************************************************
// The Main Server
// ********************************************************************************************************************************************************

protocol.createServer(options, function (req, res) 
{
	var request = url.parse(req.url, true);
	//var queryData = request.query;
    var action = request.pathname;

    logger.debug('Action Requested: ' + action);

    // Build a client ID - This is just for logging purposes

    var origin = '';
    try
    {
        origin = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    }
    catch(e)
    {
        origin = 'unknown';
    }
    var client  = req.headers['user-agent'] || "Unknown Client";

    let client_id = client + '@' + origin;

    // TODO - Get session cookie if it exists

    let this_session_id = '0';

    /*

    let this_session_cookie = req.headers['cookie'];
   
    if(this_session_cookie != undefined)
    {

        let cookie_list = this_session_cookie.split(';');

        for(ci = 0; ci < cookie_list.length; ci ++)
        {
            let next_cookie = cookie_list[ci].split('=');

            if(next_cookie[0] == 'sessionId')
            {

                this_session_id = next_cookie[1];
                break;
            }

        }

    }
    else
    {
        logger.debug('Client ' + client_id + ' has no session cookie.');
    }

    */
    

	if (req.method == 'POST') 
	{
        // Handle post info...
    
		let body = '';
		req.on('data', chunk => 
		{
			body += chunk.toString();
			//if (body.length > 1e6) 
			if (body.length > 1e3) 
			{
                // Could be a flood attack, so quickly destroy connection.
				logger.error("ALERT: Flood Attack!");
                req.connection.destroy();
            }
    	});
		req.on('end', async () => 
		{
            // Check we had a valid session.

            let session_valid = false;

            let chcksess = await check_session(client_id, this_session_id);
            session_valid = chcksess.vaild || false;
            let this_user = chcksess.username || '';

            if(!session_valid && action != '/action_login' )
            {
                // Not a valid session, so we'll either present user with login page, or create a session if allow_anon set
                //action_on_invalid_session(res, client_id, action, ''); 

                // We don't have a valid session, so attempt to serve whatever the requested url is as a static object.
                // If this object does not exist, or is not in the static_allow list, then the client will either be given a 404, or re-directed to the Login page.

                serve_static(action, res, client_id, this_session_id);

            }
            else if (action == '/action_login')
            {
                // Action Login API was called (usually by the login page)

                action_login(res, client_id, body); 
            }
            /*
            else if (action == '/api')              
            {
                action_api(res, client_id, body);
            }
            else if (action == '/tmsd/api')
            {
                action_api(res, client_id, body);  
            }
            */
            else
            {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.write('<html><body><p>Not Found</p></body></html>');
                res.end();
            }

        });

    }
	else if (action == '/' || action == '/home' || action == '/index.html' || action == '/home.html' ) 
    { 
        // ** Serve the 'Home' page. This could be redirected to login if session not valid **

        //serve_home(res, action, client_id, this_session_id);
        serve_static("/html/home.html", res, client_id, this_session_id);
    
    }
    /*
    else if (action == '/login') 
    { 
        // ** TODO - Direct Access to the Login Page will not normally be allowed. Clients will see it if they send a request to any page when they don't have a valid session id
        //           However, for testing, there's a direct link here.

        if(reload_on_refresh)
        {
            reload();
        }

 		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(login_page);
    
    }
    */
    else if (action == '/logout') 
    { 
        // ** Log User Out (i.e. destroy session) **
        
        action_logout(res, action, client_id, this_session_id);

    }
    else
    {
        // ** Serve any static object (if permissions allow) **
      
        serve_static(action, res, client_id, this_session_id);
    }
    /*
    else if (action == '/base.css')
    {    
        // ** Serve the base Style Sheet **
        
 		res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(base_css);
    }
    else if (action.startsWith('/images/'))
    {     
        // ** Serve any static images **
        
        let image_name = action.slice(8);
        let image = image_store.get(image_name);

        if(image == null)
        {
            image = fnf_image;
            image_name = fnf_image_name;
        }
        let mime_type = image_name.slice(image_name.lastIndexOf('.') + 1);

 		res.writeHead(200, { 'Content-Type': 'image/' + mime_type });
        res.end(image);
    }
    else if (action.startsWith('/fonts/'))
    {     
        // ** Serve and fonts **
        
        let font_name = action.slice(7);
        let font = font_store.get(font_name);

        if(font == null)
        {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<html><body><p>Not Found</p></body></html>');
            res.end();
        }
        let mime_type = 'x-font-ttf';

 		res.writeHead(200, { 'Content-Type': 'application/' + mime_type });
        res.end(font);
    }
    else if (action.startsWith('/html/'))
    {     
        // ** Serve any static html **
        
        let html_name = action.slice(6);
        let html = html_store.get(html_name);

        serve_html(html, res, client_id, this_session_id);
    }
    else if (action.startsWith('/css/'))
    {     
        // ** Serve any static css **
        
        let css_name = action.slice(5);
        let css = css_store.get(css_name);

        if(css == null)
        {
            res.writeHead(404, { 'Content-Type': 'text/css' });
            res.end();
        }
        else
        {
 		    res.writeHead(200, { 'Content-Type': 'text/css'});
            res.end(css);
        }
    }
    else if (action.startsWith('/lib/'))
    {     
        // ** Serve any Internal JS **
        
        let lib_name = action.slice(5);
        let lib = lib_store.get(lib_name);

        if(lib == null)
        {
            res.writeHead(404, { 'Content-Type': 'text/javascript' });
            res.end();
        }
        else
        {
 		    res.writeHead(200, { 'Content-Type': 'text/javascript'});
            res.end(tplib);
        }
    }
    else if (action.startsWith('/tplib/'))
    {     
        // ** Serve any Third Pary JS **
        
        let tplib_name = action.slice(7);
        let tplib = tplib_store.get(tplib_name);

        if(tplib == null)
        {
            res.writeHead(404, { 'Content-Type': 'text/javascript' });
            res.end();
        }
        else
        {
 		    res.writeHead(200, { 'Content-Type': 'text/javascript'});
            res.end(tplib);
        }
    }
    else
	{
        // ** Serve a 'Not Found' **

		res.writeHead(404, { 'Content-Type': 'text/html' });
		res.write('<html><body><p>Not Found</p></body></html>');
		res.end();
	}
    */

}).listen(listen_port);

console.log("");
logger.info("cnc_web_ui Running on " + listen_address + ":" + listen_port);

// ********************************************************************************************************************************************************
// End of The Main Server
// ********************************************************************************************************************************************************

// ** And Finally, catch any error that fell through **

process.on('uncaughtException', function (err) 
{
    logger.fatal('UNCAUGHT EXCEPTION: ' + err);
}); 
