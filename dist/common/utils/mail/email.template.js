"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemp = void 0;
const emailTemp = (otp) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Message</title>
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #f4f6f8;
    font-family: Arial, sans-serif;
  }
  .container {
    max-width: 500px;
    margin: 30px auto;
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  }
  .header {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
  }
  .message-box {
    background: #f1f5f9;
    padding: 15px;
    border-radius: 10px;
    font-size: 16px;
    color: #444;
    line-height: 1.5;
  }
  .footer {
    text-align: center;
    font-size: 12px;
    color: #999;
    margin-top: 20px;
  }
</style>
</head>

<body>

  <div class="container">
    
    <div class="header">
      📩 confirm your account 
    </div>

    <div class="message-box">
    OTP:  ${otp}
    </div>

    <div class="footer">
      Best social Media App
    </div>

  </div>

</body>
</html>`;
};
exports.emailTemp = emailTemp;
