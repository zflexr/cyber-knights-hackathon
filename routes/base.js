var express = require('express');
var baseController = require('../controllers/base');
var router = express.Router();

router.get('/', async function(req, res, next) {
  const { address } = req.query;
  try {
    const result = await baseController.runIt(address)
    res.status(200).json(result)
  } catch (error) {
      const newError = new Error();
      newError.message= (error.message);
      newError.status = 500;
      next(newError)
  }
});

module.exports = router;
