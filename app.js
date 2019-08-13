const $$ = require("highland");
const R = require("ramda");
const fs = require("fs");
const directories = ["D:\\", "E:\\"];
const readdir = $$.wrapCallback(fs.readdir);
const stats = $$.wrapCallback(fs.stat);
const unlink = $$.wrapCallback(fs.unlink);
const copyFile = $$.wrapCallback(fs.copyFile);
const path = require("path");
const os = require("os");

const getTheFuckingFilesOnTheseDirectory = directory =>
  readdir(directory).map(craps =>
    R.pipe(
      R.filter(crap => /^back|sql$/g.test(crap)),
      R.map(crap =>
        Backups({
          fromDirectory: directory,
          fileName: crap,
          meta: null
        })
      )
    )(craps)
  );

const getMetaDataofEachFile = backup =>
  stats(backup.pathname).map(res => ({ ...backup, meta: res }));

const Backups = ({ fromDirectory, fileName, meta }) => ({
  fromDirectory,
  fileName,
  pathname: path.resolve(fromDirectory, fileName),
  meta,
  deleted: false
});

const checkZeroByte = backup =>
  backup.meta["size"] === 0
    ? unlink(backup.pathname).map(res => ({ ...backup, deleted: true }))
    : $$([backup]);

const checkExpired = backup => {
  const backupDate = new Date(backup.meta["mtime"]);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const isExpiredYear = currentYear !== backupDate.getFullYear();
  const isExpiredMonth = currentMonth !== backupDate.getMonth() + 1;

  const terms = [isExpiredYear, isExpiredMonth];

  if (terms.includes(true)) {
    return unlink(backup.pathname).map(res => ({ ...backup, deleted: true }));
  }

  return $$([backup]);
};

const copyLatestBackup = backup => {
  const backupDate = new Date(backup.meta["mtime"]);
  const approvedMonth = backupDate.getMonth() + 1 === new Date().getMonth() + 1;
  const approvedDate = backupDate.getDate() === new Date().getDate();
  const approvedHours = backupDate.getHours() === new Date().getHours();

  const terms = [approvedMonth, approvedDate, approvedHours];

  if (terms.every(x => x === true) & (backup.deleted === false)) {
    return copyFile(
      backup.pathname,
      path.resolve(process.cwd(), `${os.hostname()}.sql`)
    )
      .doto(() => console.log("sedang mengkopi file backup ke flashdisk"))
      .map(res => backup);
  }

  return $$([backup]).doto(() => console.log("bukan file terbaru"));
};

$$(directories)
  .flatMap(getTheFuckingFilesOnTheseDirectory)
  .sequence()
  .flatMap(getMetaDataofEachFile)
  .doto(() => console.log("menghapus file backup yang gagal"))
  .flatMap(checkZeroByte)
  .flatMap(checkExpired)
  .flatMap(copyLatestBackup)
  .doto(backup => console.log(backup.pathname))
  .done(() => console.log("selesai"));
