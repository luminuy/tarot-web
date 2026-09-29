// Metro ต้องอ่านโค้ดแกนกลางและภาพไพ่ของเว็บที่อยู่นอกโฟลเดอร์ mobile/ (แผน IOS_APP_PLAN 3.2)
// — ข้อมูลไพ่ 78 ใบ · ผัง 26 แบบ · แม่หมอ อยู่ใน ../src/data ที่เดียว ห้ามคัดลอกมาไว้ในแอป
// — ภาพไพ่ 1909 อ่านตรงจาก ../public/cards (กฎเหล็กข้อ 5) ไม่มีสำเนา
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.join(repoRoot, "src", "data"), path.join(repoRoot, "src", "lib", "tarot"), path.join(repoRoot, "public", "cards")];
config.resolver.nodeModulesPaths = [path.join(projectRoot, "node_modules")];
// ⚠️ ห้ามตั้ง disableHierarchicalLookup = true — react-native ซ้อน node_modules ของตัวเองไว้
// (เช่น @react-native/virtualized-lists) ปิดแล้วบันเดิลหาไม่เจอ · โฟลเดอร์แกนกลางที่ watch ไว้
// เป็นข้อมูลล้วน ไม่ import react จึงไม่มีความเสี่ยง react ซ้อนสองชุด

module.exports = config;
