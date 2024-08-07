import otpGenerator from "otp-generator";
import Otp from "#src/models/otp.model.js";
import BcryptUtils from "#src/utils/BcryptUtils.js";

export default { generateOtp, validateOtp };

async function generateOtp(email) {
  const otpCode = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  const otpHash = BcryptUtils.makeHash(otpCode);

  await Otp.create({
    email,
    otp: otpHash,
  });

  return otpCode;
}

async function validateOtp(email, otpCode) {
  const otp = await Otp.findOne({ email }).sort({
    createdAt: "desc",
  });

  if (!otp) {
    return false;
  }

  return BcryptUtils.compareHash(otpCode, otp.otp);
}
