import { buildImage } from '$lib/docker';
import { promises as fs } from 'fs';

export default async function ({
	applicationId,
	debug,
	tag,
	workdir,
	docker,
	buildId,
	baseDirectory,
	secrets,
	pullmergeRequestId
}) {
	try {
		let file = `${workdir}/Dockerfile`;
		if (baseDirectory) {
			file = `${workdir}/${baseDirectory}/Dockerfile`;
			workdir = `${workdir}/${baseDirectory}`;
		}

		const Dockerfile: Array<string> = (await fs.readFile(`${file}`, 'utf8'))
			.toString()
			.trim()
			.split('\n');
		if (secrets.length > 0) {
			secrets.forEach((secret) => {
				if (secret.isBuildSecret) {
					if (pullmergeRequestId) {
						if (secret.isPRMRSecret) {
							Dockerfile.push(`ARG ${secret.name}=${secret.value}`);
						}
					} else {
						if (!secret.isPRMRSecret) {
							Dockerfile.push(`ARG ${secret.name}=${secret.value}`);
						}
					}
				}
			});
		}
		await fs.writeFile(`${file}`, Dockerfile.join('\n'));
		await buildImage({ applicationId, tag, workdir, docker, buildId, debug });
	} catch (error) {
		throw error;
	}
}
