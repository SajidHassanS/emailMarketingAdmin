export function setProfileImgPath(req, res, next) {
  req.storagePath = `../static/images/admin/profile-img/`;
  next();
}
