exports.getSportsHistory = async (req, res) => {

    try{

        res.json({
            success:true,
            students:[]
        });

    }

    catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};