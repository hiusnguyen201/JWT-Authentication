import userService from "./user.service.js";
import RefreshToken from "#src/models/refreshToken.model.js";
import responseCode from "#src/constants/responseCode.constant.js";
import ApiErrorUtils from "#src/utils/ApiErrorUtils.js";
import JwtUtils from "#src/utils/JwtUtils.js";
import CypherUtils from "#src/utils/CypherUtils.js";
import CryptoUtils from "#src/utils/CryptoUtils.js";

export default {
  authenticate,
  revokeToken,
  refreshToken,
};

async function authenticate(username, password, ipAddress) {
  const user = await userService.getOne(username);

  if (!user) {
    throw ApiErrorUtils.simple2(responseCode.AUTH.USER_NOT_FOUND);
  }

  const isMatch = CypherUtils.compareHash(password, user.password);
  if (!isMatch) {
    throw ApiErrorUtils.simple2(responseCode.AUTH.INVALID_PASSWORD);
  }

  const userData = user._doc;
  delete userData.password;

  const accessToken = JwtUtils.generateToken({ _id: user._id });
  const refreshToken = await generateRefreshToken(user._id, ipAddress);

  return {
    user,
    accessToken,
    refreshToken: refreshToken.token,
  };
}

async function generateRefreshToken(userId, ipAddress) {
  const refreshToken = await RefreshToken.create({
    userId,
    token: CryptoUtils.randomCrypto(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
  return refreshToken;
}

async function refreshToken(token, ipAddress) {
  const currentRefreshToken = await getRefreshToken(token);
  if (currentRefreshToken.createdByIp !== ipAddress) {
    throw ApiErrorUtils.simple2(
      responseCode.AUTH.REVOKE_TOKEN_FROM_UNAUTHORIZED_IP
    );
  }

  console.log(currentRefreshToken);
}

async function revokeToken(token, ipAddress) {
  const refreshToken = await getRefreshToken(token);
  refreshToken.revokedAt = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

async function getRefreshToken(token) {
  const refreshToken = await RefreshToken.findOne({
    token,
  }).populate({
    path: "User",
    select: "-password",
  });

  if (!refreshToken || !refreshToken.isActive) {
    throw ApiErrorUtils.simple2(responseCode.AUTH.INVALID_TOKEN);
  }

  return refreshToken;
}
