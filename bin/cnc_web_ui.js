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
// 0.0.1    20230922    Bill Fox    MVP
// ********************************************************************************************************************************************************

// ********************************************************************************************************************************************************
// Setup
// ********************************************************************************************************************************************************
var ver = '0.0.1';

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

var exec = require('child_process').exec;


console.log("** cnc_web_ui **");
console.log("");

//var os_platform = os.platform + ' ' + os.release ;

var default_replacements = [
    {search: "{{err_msg}}", replace: ""},
    {search: "{{msg}}", replace: ""},
];

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
var users_file = config.get("users");

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
const { timeStamp } = require('console');

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
logger.info("+-->dev_mode = " + dev_mode);


var static_allow = {};
var cases = {};

// Load user case data

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
    cases.cases[inc_case].running = false;
}

// Load Static Allow data

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

// Load user info

logger.info("+-->users = " + users_file);

var users = new HashMap();

load_users();

// Set up server protocol

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

// ** load_users - (re)load user information from file into hashmaps 

function load_users()
{

    let users_data = {};

    try
    {
        users_data = JSON.parse(fs.readFileSync(users_file));
    }
    catch(e)
    {
        logger.fatal(e);
        logger.fatal("Failed to read user information from config file " + users_file + ". We can't run without this, so exiting now.");
        exit(1);
    }

    logger.trace("   |");
    for(let inc_user = 0; inc_user < users_data.users.length; inc_user ++)
    {
        logger.trace("   +-->" + users_data.users[inc_user].user);
        users.set(users_data.users[inc_user].user, users_data.users[inc_user]);
    }
}

// ********************************************************************************************************************************************************
// Server Actions
// ********************************************************************************************************************************************************

// serve_static - Serve a static object (such as html, css etc)

async function serve_static(action, res, client_id, this_session_id, replacements)
{

    let chcksess = await check_session(client_id, this_session_id);
    let session_valid = chcksess.vaild || false;
    let this_user = chcksess.username || '';

    if(anon_allow && !session_valid)    
    {
        // If we don't have a vaild session, but anon_allow is true, so create a new session, cookie etc, and re-diect the user back to their requested page

        this_session_id = create_session(this_user);

        let headers = {
            'Content-Type': 'text/html',
            'Set-Cookie': 'sessionId=' + this_session_id + '; SameSite=Strict'
        }; 

        let this_redirect = replaceAll(html_store.get("redirect.html"), '{{redirect}}', action);
        res.writeHead(200, headers); 
        res.end(this_redirect);
    }
    else
    {

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
                action = "/html/login.html";
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
                    // Perform any dynamic text replacement

                    for(let inc_rep = 0; inc_rep < replacements.length; inc_rep ++)
                    {
                        html = replaceAll(html, replacements[inc_rep].search, replacements[inc_rep].replace);
                    }

                    // Now write the html back to the client

                    res.writeHead(200, { 'Content-Type': 'text/html'});
                    res.end(html);
                }
            }
            else if (action.startsWith('/images/'))
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
            else
            {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.write('<html><body><p>Not Found</p></body></html>');
                res.end();
            }
        }
    }

}

// action_api - Action a requested API

async function action_api(api_name, res, client_id, body)
{
    let json_loaded = {success: false, msg: "Unidentified Error?", code: 1};
    let itsascript = false;
    let script = "";
    let script_result = {
        success: false,
        code: 1,
        msg: "Unidentified Error?",
        stdout: "",
        stderr: ""
    };
    let resp_code = 200;
    let starting_case = false;
    let stopping_case = false;
    let case_id = "0000";

    logger.debug("Client " + client_id + " requested API " + api_name);

    if(api_name == 'check_k8s')
    {
        script = "kubectl cluster-info";
        itsascript = true;
    }
    else if(api_name == 'check_labs_gen')
    {
        script = "../status.sh";
        itsascript = true;
    }
    else if(api_name == 'get_cases')
    {
        json_loaded = cases;
    }
    else if(api_name == 'start_case')
    {
        case_id = JSON.parse(body).case_id || "0000";
        script = "../usecase.sh start " + case_id;
        //script = "../dummy.sh start " + case_id;
        itsascript = true;
        starting_case = true;
    }
    else if(api_name == 'stop_case')
    {
        case_id = JSON.parse(body).case_id || "0000";
        script = "../usecase.sh stop " + case_id;
        //script = "../dummy.sh stop " + case_id;
        itsascript = true;
        stopping_case = true;
    }
    else
    {
        json_loaded = {success: false, msg: "Unknown API."};
        resp_code = 404;
        logger.debug("Rejecting client " + client_id + " request for api " + api_name + " as this api does not exist.");
    }

    if(itsascript)
    {
        // The requested API needs to call a script. Let's do that:

        script_result = await run_script(script);

        //console.log(script_result);

        json_loaded.success = script_result.success;
        json_loaded.msg = script_result.msg;
        json_loaded.code = script_result.code;

        if(!script_result.success)
        {
            logger.debug('Run of script "' + script + '" returned a non-success code: ' + JSON.stringify(script_result));
        }
        else
        {
            logger.debug('Run of script "' + script + '" returned a success code: ' + JSON.stringify(script_result));
            if(starting_case && !get_case_status(case_id))
            {
                set_case_status(case_id, true);
            }
            if(stopping_case && get_case_status(case_id))
            {
                set_case_status(case_id, false);
            }
        }
    }

    logger.debug('Sending response to client "' + client_id + '"');
    res.writeHead(resp_code, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(json_loaded));
    res.end();
}

// ********************************************************************************************************************************************************
// Utility Functions
// ********************************************************************************************************************************************************

function escapeRegExp(str) 
{
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) 
{
    return(str.replace(new RegExp(escapeRegExp(find), 'g'), replace));
}

// run_script - Run Script

async function run_script(cmd2start)
{

    return new Promise(async function(resolve) 
    {

        let string_loaded = "";
        let string_errors = "";


        let script = exec(cmd2start);

        script.stdout.on('data', function(data)
        {
            string_loaded += data.toString();
        });
        
        script.stderr.on('data', function(data)
        {
            string_errors += data.toString();
        });

        script.on('exit', function(code)
        {

            /*
            console.log("STDOUT:" + string_loaded);
            console.log("STDERR:" + string_errors);
            console.log(code);
            */

            let success = false;
            let msg = "";
            let stdout = string_loaded;
            let stderr = string_errors;

            if(code == 0)
            {
                success = true;
                msg = stdout;
            }
            else
            {
                msg = stdout + "\n" + stderr;
            }

            let result = {
                success: success,
                code: code,
                msg: msg,
                stdout: stdout,
                stderr: stderr
            }
            resolve(result);

        });
    }).catch((error) => 
    {
        logger.error(error);
    });

}

// set_case_status - set running status of given case

function set_case_status(case_id, running)
{
    for(let inc_case = 0; inc_case < cases.cases.length; inc_case ++)
    {
        if(cases.cases[inc_case].id == case_id)
        {
            cases.cases[inc_case].running = running;
            break;
        }
    }
}

// get_case_status - get running status of given case

function get_case_status(case_id)
{

    let running = false;

    for(let inc_case = 0; inc_case < cases.cases.length; inc_case ++)
    {
        if(cases.cases[inc_case].id == case_id)
        {
            running = cases.cases[inc_case].running;
            break;
        }
    }

    return(running);
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

        logger.debug(client_id + ' - Checking session id of ' + session_id + ' is valid...');

        let session_valid = false;
        let the_user = 'guest';
        let the_timestamp = 0;

        if(session_ids.has(session_id))
        {
            the_user = session_ids.get(session_id);

            the_timestamp = session_timestamp.get(session_id);

            let now = new Date();
            let time_diff = now - the_timestamp;

            if(time_diff < inactivity_timeout)
            {
                session_valid = true;
                logger.debug(client_id + ' - Session ID ' + session_id + ' is valid for user "' + the_user + '"');
                session_timestamp.set(session_id, now);
            }
            else
            {
                logger.debug(client_id + ' - Session ID ' + session_id + ' has timed out for "' + the_user + '"');
            }
        }
        else
        {
            logger.debug(client_id + ' - Session ID ' + session_id + ' is not valid for "' + the_user + '"');
        }

        let result = {vaild: session_valid, username: the_user};

        resolve(result);

    }).catch((error) => 
    {
        logger.error(error);
    });


}

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


        let p_correct = false;
        let check_user_exists = false;

        if(login_pass == '' || login_user == '')
        {
            logger.debug(client_id + ' - Unable to log user "' + login_user + '" in. Reason is: User or Password fields have been left blank.');
            err_msg = 'Incorrect Username/Password combination. Please try again.';
        }
        else
        {
            check_user_exists = users.has(login_user);
        }

        if(check_user_exists)
        {

            let get_user = users.get(login_user)

            p_correct = check_password(login_pass, get_user.salt, get_user.saltiness, get_user.hash);

            if(!p_correct)
            {
                logger.debug(client_id + ' - User "' + login_user + '" gave incorrect password.');
                err_msg = 'Incorrect Username/Password combination. Please try again.';
            }
            else
            {
                // Create Session

                session_id = create_session(login_user);
                
            }

        }

        let headers;

        if(p_correct)
        {
            headers = {
                'Content-Type': 'text/html',
                'Set-Cookie': 'sessionId=' + session_id + '; SameSite=Strict'
            }; 

            let this_redirect = replaceAll(html_store.get("redirect.html"), '{{redirect}}', redirect_path);
            res.writeHead(200, headers); 
            res.end(this_redirect);
    
        }
        else
        {

            /*
            let tryagain = replaceAll(html_store.get("login.html"), '{{err_msg}}', "Invaild Username and/or Password");
            res.writeHead(401, headers); 
            res.end(tryagain);
            */

           let replacements = [
                {search: "{{err_msg}}", replace: "Invaild Username and/or Password"},
                {search: "{{msg}}", replace: ""},
            ];
        
            serve_static("/html/login.html", res, client_id, session_id, replacements);
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

// create_session - Create user session

function create_session(login_user)
{
        // Create Session

        let session_id = uuidv4();  
        let timestamp = new Date();

        session_ids.set(session_id,login_user);    // Key on session ID, with user as value
        session_timestamp.set(session_id,timestamp); // key on session ID, with epoch timestamp of when session was created

        return(session_id)
}

// action_logout - Action a user logout request

async function action_logout(res, action, client_id, this_session_id)
{

    return new Promise(async function(resolve) 
    {

        let kill_sess_result = true;

        session_ids.delete(this_session_id);
        session_timestamp.delete(this_session_id);

        let replacements = [
            {search: "{{err_msg}}", replace: ""},
            {search: "{{msg}}", replace: "Logout Successful"},
        ];
      
        if(anon_allow)
        {
            serve_static("/html/home.html", res, client_id, this_session_id, default_replacements);
        }
        else
        {
            serve_static("/html/login.html", res, client_id, this_session_id, replacements);
        }

        resolve(kill_sess_result);
        
    }).catch((error) => 
    {
        logger.error(error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Error:</p>' + error + '</body></html>');
        res.end();
    });

}

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

    // Get session cookie if it exists

    let this_session_id = '0';


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

        logger.debug('Client ' + client_id + ' has a session cookie with a session ID of ' + this_session_id);

    }
    else
    {
        logger.debug('Client ' + client_id + ' has no session cookie.');
    }

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
            // Check we have a valid session.

            let session_valid = false;

            let chcksess = await check_session(client_id, this_session_id);
            session_valid = chcksess.vaild || false;
            let this_user = chcksess.username || 'guest';

            if(anon_allow && !session_valid)    
            {
                // If we don't have a vaild session, but anon_allow is true, create a new session, cookie etc, and re-diect the user back to their requested page

                this_session_id = create_session(this_user);

                let headers = {
                    'Content-Type': 'text/html',
                    'Set-Cookie': 'sessionId=' + this_session_id + '; SameSite=Strict'
                }; 
    
                let this_redirect = replaceAll(html_store.get("redirect.html"), '{{redirect}}', action);
                res.writeHead(200, headers); 
                res.end(this_redirect);
            }
            else if(!session_valid && action != '/action_login' )
            {
                // We don't have a valid session, so attempt to serve whatever the requested url is as a static object.
                // If this object does not exist, or is not in the static_allow list, then the client will either be given a 404, or re-directed to the Login page.

                serve_static(action, res, client_id, this_session_id, default_replacements);

            }
            else if (action == '/action_login')
            {
                // Action Login

                action_login(res, client_id, body); 
            }
            
            else if (action.startsWith('/api/'))              
            {
                let api_name = action.slice(5);
                action_api(api_name, res, client_id, body);
            }
            else
            {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.write('<html><body><p>Not Found</p></body></html>');
                res.end();
            }

        });

    }
	else if (action == '/' || action == '/home' || action == '/index.html' || action == '/home.html' || action == '/html/home.html' ) 
    { 
        // ** Serve the 'Home' page. This could be redirected to login if session not valid **

        serve_static("/html/home.html", res, client_id, this_session_id, default_replacements);

    
    }
    else if (action == '/action_logout') 
    { 
        // ** Log User Out (i.e. destroy session) **
        
        action_logout(res, action, client_id, this_session_id);

    }
    else if (action == '/favicon.ico')
    {
        // ** Serve the favicon

        serve_static('/images/favicon.ico', res, client_id, this_session_id, default_replacements );
    }
    else
    {
        // ** Serve any static object (if permissions allow) **

        serve_static(action, res, client_id, this_session_id, default_replacements );
    }

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

