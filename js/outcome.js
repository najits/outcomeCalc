function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isValidNumericInput(n) {
	return (n && isNumeric(n) && (n > 0)) ? 1 : 0;
}

/**
* args.paths: number of simulation paths
* args.periods: simulation horizon (years)
* args.portfolioReturnMean: mean portfolio return (% annual)
* args.portfolioReturnStDev: std dev of portfolio returns (% annual)
* args.initialCapital: starting capital amount
* args.annualSavingsAmt: savings adding to intial capital (annual)
* args.savingsDuration: remaining periods of additional savings (years)
* args.monthlyWithdrawalAmt: withdrawals required from portfolio (monthly)
* args.withdrawalStartOffset: period in which withdrawals being (years)
**/
var calcOutcomes = function(args) {
	/* Process arguments */

	// Normal random generated seeded with monthly portfolio return and volatility
	if(!isNumeric(args.portfolioReturnMean)) {
		return;
	} else {
		var portfolioReturnMean = args.portfolioReturnMean / 100;
	}
	if(!isNumeric(args.portfolioReturnStDev) || (args.portfolioReturnStDev < 0)) {
		return;
	} else {
		var portfolioReturnStDev = args.portfolioReturnStDev / 100;
	}
	var rand = d3.random.normal(portfolioReturnMean, portfolioReturnStDev);

	// Simulation paths
	var maxPaths = 10000;
	var defaultPaths = 5000;
	var numPaths = isValidNumericInput(args.paths) ? Math.min(args.paths, maxPaths) : defaultPaths;

	// Periods per path
	var maxPeriods = 60;
	var defaultPeriods = 40;
	var numPeriods = isValidNumericInput(args.periods) ? Math.min(args.periods, maxPeriods) : defaultPeriods;

	// Inital capital
	var defaultInitialCapital = 1e06;
	var initialCapital = isValidNumericInput(args.initialCapital) ? args.initialCapital : defaultInitialCapital;

	// Savings
	var annualSavingsAmt = (args.annualSavingsAmt && isNumeric(args.annualSavingsAmt)) ? args.annualSavingsAmt : 0;
	var savingsDuration = isValidNumericInput(args.savingsDuration) ? args.savingsDuration : 0;

	// Withdrawals
	var _monthlyWithdrawalAmt = (args.monthlyWithdrawalAmt && isNumeric(args.monthlyWithdrawalAmt)) ? args.monthlyWithdrawalAmt : 0;
	var annualWithdrawalAmt = _monthlyWithdrawalAmt * 12;
	var withdrawalStartOffset = isValidNumericInput(args.withdrawalStartOffset) ? args.withdrawalStartOffset : 0;

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

	// Flow vector to contain net of savings and withdrawals
	var flowVector = [];
	flowVector[0] = 0;

	// Initalize arrays for 'per period' summary metrics
	var alivePct = [];
	alivePct[0] = numPaths;
	var q25 = []
	q25[0] = initialCapital;
	var q50 = [];
	q50[0] = initialCapital;
	var q75 = [];
	q75[0] = initialCapital;


	/* Simulate NAVs */

	// Cycle through per period, per path
	var index, slice, i, j;
	for(i = 0; i < numPeriods; i++) {
		j = i + 1;
		alivePct[j] = 0;

		flowVector[j] = 0;
		flowVector[j] += (j <= savingsDuration) ? annualSavingsAmt : 0;
		flowVector[j] -= (j > withdrawalStartOffset) ? annualWithdrawalAmt : 0;

		index = math.index(i, [0, numPaths]);
		slice = math.add(
					math.dotMultiply(navMatrix.subset(index), returnsMatrix.subset(index)),
					flowVector[j])
						.map(function(value, index, matrix) {
							if(value > 0) {
								alivePct[j] += 1;
								return value;
							} else {
								return 0;
							}
						});

		navMatrix.subset(math.index(j, [0, numPaths]), slice);

		slice._data[0].sort(d3.ascending);
		q25[j] = d3.quantile(slice._data[0], 0.25);
		q50[j] = d3.quantile(slice._data[0], 0.50);
		q75[j] = d3.quantile(slice._data[0], 0.75);
	}

	// Convert 'alive' to percentage of scenarios that are successful
	alivePct = math.multiply(alivePct, (100 / numPaths));

	// Extract terminal NAVs
	var terminalNav = [];
	navMatrix.subset(math.index(numPeriods, [0, numPaths]))
		.forEach(function(value, index, matrix) {
			terminalNav[index[1]] = value;
		});


	/* Collate results and return */

	var results = {};
	results.paramsUsed = {
		numPaths: numPaths,
		numPeriods: numPeriods,
		initialCapital: initialCapital,
		annualSavingsAmt: annualSavingsAmt,
		savingsDuration: savingsDuration,
		annualWithdrawalAmt: annualWithdrawalAmt,
		withdrawalStartOffset: withdrawalStartOffset,
		portfolioReturnMean: portfolioReturnMean,
		portfolioReturnStDev: portfolioReturnStDev
	};
	results.alivePct = alivePct;
	results.q25 = q25;
	results.q50 = q50;
	results.q75 = q75;
	results.terminalNav = terminalNav;

	return results;
};

