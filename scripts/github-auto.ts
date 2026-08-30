import { execSync } from "child_process";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
  } catch (error: any) {
    const stdout = error.stdout ? error.stdout.toString() : "";
    const stderr = error.stderr ? error.stderr.toString() : "";
    throw new Error(`Command failed: ${cmd}\n${stdout}\n${stderr}`);
  }
}

const action = process.argv[2] || "status";

switch (action) {
  case "verify-all": {
    console.log("🔍 [GitHub Auto] กำลังรัน Verification Suite ทั้งระบบ...");
    try {
      run("npm run agent:check");
      console.log("  ✓ 🛡️ Agent Collision Check ผ่าน");
      run("npm run typecheck");
      console.log("  ✓ 🔍 TypeScript Typecheck ผ่าน (0 errors)");
      run("./node_modules/.bin/tsx scripts/verify-cards.ts");
      console.log("  ✓ 🃏 78 Cards Integrity ผ่าน");
      run("./node_modules/.bin/tsx scripts/qa/test-spreads.ts");
      console.log("  ✓ 📐 20 Spreads Geometry ผ่าน");
      console.log("\n✨ ทุกการตรวจสอบผ่านสมบูรณ์ 100% พร้อมสร้าง/Merge PR ได้ทันที!");
    } catch (e: any) {
      console.error(`❌ Verification ล้มเหลว:\n${e.message}`);
      process.exit(1);
    }
    break;
  }

  case "pr": {
    const title = process.argv[3] || "feat: automated improvements and updates";
    const body = process.argv[4] || "✦ Automated Pull Request with full test verification and auto-merge configuration.";

    console.log("🚀 [GitHub Auto] กำลังสร้าง Pull Request และเปิดระบบ Auto-Merge...");
    try {
      const currentBranch = run("git branch --show-current");
      if (currentBranch === "main") {
        console.log("ℹ️ คุณอยู่ที่ branch 'main' อยู่แล้ว หากต้องการสร้าง PR กรุณา switch ไปยัง feature branch");
        break;
      }
      run(`git push -u origin ${currentBranch}`);
      const prUrl = run(`gh pr create --title "${title}" --body "${body}" --base main`);
      console.log(`✨ สร้าง PR สำเร็จ: ${prUrl}`);
      run(`gh pr merge --auto --squash --delete-branch`);
      console.log("🔀 เปิดใช้งาน Auto-Merge เรียบร้อยแล้ว (จะ Merge เข้า main ทันทีที่ CI ผ่าน)");
    } catch (e: any) {
      console.error(`❌ ผิดพลาด: ${e.message}`);
      process.exit(1);
    }
    break;
  }

  case "status":
  default: {
    console.log("\n=======================================================");
    console.log("🤖 GITHUB AUTOMATION ENGINE & REPO HEALTH");
    console.log("=======================================================");
    try {
      const status = run("gh auth status");
      console.log("GitHub Auth:\n" + status);
      const prs = run("gh pr list --state open");
      console.log("\nOpen Pull Requests:\n" + (prs || "ไม่มี PR ที่เปิดค้างอยู่"));
    } catch (e: any) {
      console.log("GitHub Status: " + e.message);
    }
    break;
  }
}
