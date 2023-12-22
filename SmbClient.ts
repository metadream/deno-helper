import { join } from "https://deno.land/std@0.200.0/path/join.ts";

const textDecoder = new TextDecoder();

export type SmbOption = {
    hostname: string,
    port?: number,
    username?: string,
    password?: string
};

export type SmbFile = {
    type: "SHARE" | "DIR" | "FILE",
    name: string,
    comment?: string,
    size?: number,
    ctime?: Date,
};

/**
 * Samba Client
 * Depends on smbclient CLI: apt install smbclient
 *
 * @example const smb = new SmbClient({ hostname: "10.0.0.2" });
 *          smb.authenticate("username", "password")
 *          const smbFile = smb.readDir("/");
 * @Author metadream
 * @Since 2023-12-17
 */
export class SmbClient {

    private smbOption: SmbOption = {
        hostname: '', port: 445, username: '', password: ''
    };

    constructor(smbOption: SmbOption) {
        Object.assign(this.smbOption, smbOption);
    }

    authenticate(username: string, password: string) {
        Object.assign(this.smbOption, { username, password });
    }

    readFile(path: string) {
        const index = path.lastIndexOf("/");
        this.sendCommand("get " + path.substring(index + 1) + " -", path.substring(0, index));
    }

    readDir(path = "/"): SmbFile[] {
        return path === "/" ? this.listShares() : this.listFiles(path);
    }

    private listShares(): SmbFile[] {
        const smbClient = new Deno.Command("smbclient", {
            args: [
                "-L", this.smbOption.hostname,
                "-p", this.smbOption.port + "",
                "-U", this.smbOption.username + "%" + this.smbOption.password,
            ],
        });

        const stdout = textDecoder.decode(smbClient.outputSync().stdout).split(/\n+/);
        const smbFiles: SmbFile[] = [];
        let start = false;

        for (let line of stdout) {
            line = line.trim();
            if (!line) continue;
            if (line.startsWith("---")) { start = true; continue; }
            if (!start) continue;

            const values = line.split(/\s{2,}/);
            if (values.length != 3) continue;
            if (values[1] != 'Disk') continue;

            smbFiles.push({
                type: "SHARE",
                name: values[0],
                comment: values[2],
            });
        }
        return smbFiles;
    }

    private listFiles(path: string): SmbFile[] {
        const smbFiles: SmbFile[] = [];
        const stdout = this.sendCommand("ls", path);

        for (let line of stdout) {
            line = line.trim();
            if (!line) break;

            const createTime = line.slice(-24);
            line = line.slice(0, -24).trim();

            const values = line.split(/\s{2,}/);
            if (values.length != 3) continue;
            if (values[0] === "." || values[0] === "..") continue;

            smbFiles.push({
                type: values[1] === 'A' ? "FILE" : "DIR",
                name: values[0],
                size: parseInt(values[2]),
                ctime: new Date(createTime),
            });
        }
        return smbFiles;
    }

    private sendCommand(command: string, path: string): string[] {
        const smbClient = new Deno.Command("smbclient", {
            args: [
                "-c", command,
                "//" + join(this.smbOption.hostname, path),
                "-p", this.smbOption.port + "",
                "-U", this.smbOption.username + "%" + this.smbOption.password,
            ],
        });

        console.log([
            "-c", command,
            "//" + join(this.smbOption.hostname, path),
            "-p", this.smbOption.port + "",
            "-U", this.smbOption.username + "%" + this.smbOption.password,
        ].join(" "));

        const output = smbClient.outputSync();
        const stderr = textDecoder.decode(output.stderr);
        if (stderr) {
            throw new Error(stderr);
        }

        const stdout = textDecoder.decode(output.stdout);
        if (stdout.startsWith("tree connect failed")) {
            throw new Error(stdout);
        }
        return stdout.split(/\n/);
    }

}