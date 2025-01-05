/**
 * SettingsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Status = sails.config.constants.ResponseCodes;
const ENCRYPT_KEY = sails.config.globals.encryptKey;
const ENCRYPT_IV = sails.config.globals.encryptIV;
const TOKEN_SECRET = sails.config.session.tokenSecret;

module.exports = {

    addSettings: async (req, res) => {
        let response = {};
        const systemDetails = await Settings.create({
            system: {
                encrypt_key: '',
                encrypt_iv: '',
                jwt_secret: '',
                
            }
        });
        response.status = Status.OK;
        response.data = systemDetails;
        response.message = "System account settings updated successfully."
        return res.status(Status.OK).json(response);
    },
    
    updateSystemSettings: async (req, res) => {
        let response = {};
        let systemDetails = {}; 
        if (req.body.encrypt_key) {
            systemDetails.encrypt_key = req.body.encrypt_key;
        }
        if (req.body.encrypt_iv) {
            systemDetails.encrypt_iv = req.body.encrypt_iv;
        }
        if (req.body.jwt_secret) {
            systemDetails.jwt_secret = req.body.jwt_secret;
        }       
        // console.log(req.body);
        // console.log(systemDetails);
        const updatedSettings = await Settings.update({}).set({
            "system": systemDetails
        });
        response.status = Status.OK;
        response.data = updatedSettings;
        response.message = "System settings updated successfully."
        return res.status(Status.OK).json(response);
    },

    getSettings: async (req, res) => {
        let response = {};
        const settings = await Settings.find({});
        console.log("Settings " + settings);
        if(settings && settings.length){
            response.status = Status.OK;
            response.data = settings;
            response.message = "Get system account settings successfully."
            return res.status(Status.OK).json(response);
        }
        else {
            console.log('Creating seetting atable ..');
            const settings = await Settings.create({
                system: {
                    jwt_secret: TOKEN_SECRET,
                    encrypt_key: ENCRYPT_KEY,
                    encrypt_iv: ENCRYPT_IV,
                }
            })
            .fetch()
            .catch((error) => {
              response.status = Status.BAD_REQUEST;
              response.error = error;
              response.message = "Unable to create settings.";
              return res.status(Status.OK).json(response);
            });
            response.status = Status.OK;
            response.data = settings;
            response.message = "Settings added."
            console.log('Settings ', response);
        }
    },
};

