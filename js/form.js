var main = function() {
	$('#submit').click(function() {
		var simParams = {
			paths: 5000,
			periods: 60,
			initialCapital: parseFloat($('#initialCapital').val()),
			portfolioReturnMean: parseFloat($('#portfolioReturns').val()),
			portfolioReturnStDev: parseFloat($('#portfolioVol').val()),
			monthlyWithdrawalAmt: parseFloat($('#withdrawals').val()),
			withdrawalStartOffset: parseFloat($('#withdrawalStart').val()),
			annualSavingsAmt: parseFloat($('#savings').val()),
			savingsDuration: parseFloat($('#savingsDuration').val())
		};

		var sim = calcOutcomes(simParams);
		console.log('Results:');
		console.log(sim);

		$('.results').empty();
		$('<h4>').text('Parameters').appendTo('.results');
		$('<ul>').appendTo('.results').addClass('parameters');
		for(var prop in simParams) {
			var item = '<li>' + prop + ': ' + simParams[prop];
			$('.parameters').append(item);
		}
	});
};

$(document).ready(main);