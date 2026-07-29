import fs from 'fs';

let file = '/home/truphile/Documents/DripWaves/stellar-wave-hub/web/src/app/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import {
  ON_CHAIN_ENABLED,`,
  `import {
  getContractConfig,`
);

content = content.replace(
  `  useEffect(() => {
    if (ON_CHAIN_ENABLED) fetchInfo();
  }, [fetchInfo]);

  if (!ON_CHAIN_ENABLED) {`,
  `  const [onChainEnabled, setOnChainEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    getContractConfig().then((cfg) => {
      setOnChainEnabled(Boolean(cfg.contractId));
      setConfigLoaded(true);
      if (cfg.contractId) fetchInfo();
    });
  }, [fetchInfo]);

  if (!configLoaded) {
    return <div className="glass rounded-2xl p-12 text-center text-ash">Loading contract config...</div>;
  }

  if (!onChainEnabled) {`
);

fs.writeFileSync(file, content);
console.log("admin/page.tsx updated");

file = '/home/truphile/Documents/DripWaves/stellar-wave-hub/web/src/app/projects/[slug]/page.tsx';
content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import {
	ON_CHAIN_ENABLED,`,
  `import {
	getContractConfig,`
);

content = content.replace(
  `	// On-chain state
	const [contractRatingFee, setContractRatingFee] = useState<bigint | null>(null);`,
  `	// On-chain state
	const [onChainEnabled, setOnChainEnabled] = useState(false);
	const [contractRatingFee, setContractRatingFee] = useState<bigint | null>(null);

	useEffect(() => {
		getContractConfig().then(cfg => setOnChainEnabled(Boolean(cfg.contractId)));
	}, []);`
);

content = content.replace(/ON_CHAIN_ENABLED/g, "onChainEnabled");

fs.writeFileSync(file, content);
console.log("projects/[slug]/page.tsx updated");
