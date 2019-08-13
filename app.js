const $$ = require("highland");
const R = require("ramda");
const fs = require("fs");
const directories = ["./D", "./E"];
const readdir = $$.wrapCallback(fs.readdir);
const stats = $$.wrapCallback(fs.stat);
const unlink = $$.wrapCallback(fs.unlink);
const path = require("path");

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
	meta
});

const checkZeroByte = backup =>
	backup.meta["size"] === 0
		? unlink(backup.pathname).map(res => backup)
		: $$([backup]);

$$(directories)
	.flatMap(getTheFuckingFilesOnTheseDirectory)
	.sequence()
	.flatMap(getMetaDataofEachFile)
	.flatMap(checkZeroByte)
	.doto(console.log)
	.done(() => console.log("selesai"));
