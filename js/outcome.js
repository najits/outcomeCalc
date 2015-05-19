function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isValidNumericInput(n) {
	return (n && isNumeric(n) && (n > 0)) ? 1 : 0;
}

/**
* args.paths: number of simulation paths
* args.periods: number of periods per path
* args.portfolioReturnMean: mean portfolio return (% annual)
* args.portfolioReturnStDev: std dev of portfolio returns (% annual)
* args.initialCapital: starting capital amount
* args.netMonthlyFlow: net of capital inflow and output per month
**/
var calcOutcomes = function(args) {
	/* Process arguments */

	// Normal random generated seeded with monthly portfolio return and volatility
	if(!isNumeric(args.portfolioReturnMean)) { return; }
	if(!isNumeric(args.portfolioReturnStDev) || (args.portfolioReturnStDev < 0)) { return; }
	var rand = d3.random.normal((args.portfolioReturnMean / 100) / 12, (args.portfolioReturnStDev / 100) / Math.sqrt(12));

	// Simulation paths
	var maxPaths = 10000;
	var defaultPaths = 1000;
	var numPaths = isValidNumericInput(args.paths) ? Math.min(args.paths, maxPaths) : defaultPaths;

	// Periods per path
	var maxPeriods = 360;
	var defaultPeriods = 120;
	var numPeriods = isValidNumericInput(args.periods) ? Math.min(args.periods, maxPeriods) : defaultPeriods;

	// Inital capital
	var maxInitalCapital = 1e09;
	var defaultInitialCapital = 1e06;
	var initialCapital = isValidNumericInput(args.initialCapital) ? Math.min(args.initialCapital, maxInitalCapital) : defaultInitialCapital;

	// Monthly flow
	var defaultMonthlyFlow = 0;
	var monthlyFlow = (args.netMonthlyFlow && isNumeric(args.netMonthlyFlow)) ? args.netMonthlyFlow : defaultMonthlyFlow;


	/* Create matrices */

	// Fill returns matrix (periods x paths) with random normal draws (plus 1 to convert to scalar)
	var returnsMatrix = math.add(
		                    math.zeros(numPeriods, numPaths)
								.map(function(value, index, matrix) {
									return rand();
								}),
							1);

	// Fill nav matrix (periods + 1 x paths) with starting capital amount
	var navMatrix = math.add(math.zeros(numPeriods + 1, numPaths), initialCapital);

	// Initalize array containing number of successful paths per period
	var alivePct = [];
	alivePct[0] = numPaths;


	/* Simulate NAVs */

	// Cycle through per period, per path
	var index, slice, i, j;
	for(i = 0; i < numPeriods; i++) {
		j = i + 1;
		alivePct[j] = 0;
		index = math.index(i, [0, numPaths]);
		slice = math.add(
					math.dotMultiply(navMatrix.subset(index), returnsMatrix.subset(index)),
					monthlyFlow)
						.map(function(value, index, matrix) {
							if(value > 0) {
								alivePct[j] += 1;
								return value;
							} else {
								return 0;
							}
						});
		navMatrix.subset(math.index(j, [0, numPaths]), slice);
	}


	/* Summarize results */

	// Convert 'alive' to percentage of scenarios that are successful
	alivePct = math.multiply(alivePct, (100 / numPaths));

	// Extract terminal NAVs
	var terminalNav = [];
	navMatrix.subset(math.index(numPeriods, [0, numPaths]))
		.forEach(function(value, index, matrix) {
			terminalNav[index[1]] = value;
		});

	// Collate results and return
	var results = {};
	results.alivePct = alivePct;
	results.terminalNav = terminalNav;

	return results;
};


