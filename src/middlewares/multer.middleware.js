export function setProfileImgPath(req, res, next) {
  req.storagePath = `../static/images/employer/profilepic`;
  next();
}
