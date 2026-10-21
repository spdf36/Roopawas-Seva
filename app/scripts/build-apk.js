#!/usr/bin/env node
/**
 * Build an installable demo APK on this machine (no EAS account needed).
 *
 *   npm run build:apk [-- --clean]
 *
 * Runs `expo prebuild` to generate android/, then Gradle's assembleRelease, and
 * copies the result to builds/. The APK is signed with the debug key, which is
 * fine for sideloading on demo phones but not for the Play Store.
 *
 * Windows: keep this project's folder path short. The native (CMake/ninja) step
 * embeds the path twice in object-file names and fails with "build.ninja still
 * dirty after 100 tries" once they pass 260 characters. Drive mappings (subst)
 * and junctions do not help, because Expo autolinking resolves the real path.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const isWindows = process.platform === 'win32';
const clean = process.argv.includes('--clean');

// A Gradle daemon left over from an earlier build keeps files in android/ locked on
// Windows, which makes prebuild fail with EBUSY when it needs to regenerate the folder.
const gradlew = path.join(androidDir, isWindows ? 'gradlew.bat' : 'gradlew');
stopDaemons();

run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install', ...(clean ? ['--clean'] : [])], root);
// Absolute path: Windows shells may not search the current directory for commands.
// arm64-v8a only: covers practically every Android phone from the last several years and
// keeps the build fast and the APK small. Add armeabi-v7a for old 32-bit devices.
const status = run(gradlew, ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a'], androidDir, false);
// Stop the daemons whether or not the build succeeded, so nothing is left running
// (and holding ~2 GB of memory and file locks) once this script exits.
stopDaemons();
if (status !== 0) process.exit(status || 1);

const { version } = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const source = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const target = path.join(root, 'builds', `roopawas-seva-${version}.apk`);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log(`\nBuilt ${path.relative(root, target)}`);

/**
 * Stops the Gradle daemon and the Kotlin compiler daemon it spawns. Both are shared per
 * user, so this also stops ones started by other projects on the same Gradle version.
 */
function stopDaemons() {
  if (fs.existsSync(gradlew)) run(gradlew, ['--stop'], androidDir, false);
  // 'gradlew --stop' leaves the Kotlin daemon behind; it has no stop command of its own.
  if (isWindows) {
    spawnSync('powershell', ['-NoProfile', '-Command',
      "Get-CimInstance Win32_Process -Filter \"Name LIKE 'java%'\" | Where-Object { $_.CommandLine -match 'KotlinCompileDaemon' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"], { stdio: 'inherit' });
  } else {
    spawnSync('pkill', ['-f', 'KotlinCompileDaemon'], { stdio: 'ignore' });
  }
}

function run(command, args, cwd, exitOnFailure = true) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const quoted = isWindows && command.includes(' ') ? `"${command}"` : command;
  const result = spawnSync(quoted, args, { cwd, stdio: 'inherit', shell: isWindows });
  if (result.status !== 0 && exitOnFailure) process.exit(result.status || 1);
  return result.status;
}
