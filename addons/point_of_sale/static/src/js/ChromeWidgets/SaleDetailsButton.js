odoo.define('point_of_sale.SaleDetailsButton', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { renderToString } = require('@web/core/utils/render');

    class SaleDetailsButton extends PosComponent {
        async onClick() {
            // IMPROVEMENT: Perhaps put this logic in a parent component
            // so that for unit testing, we can check if this simple
            // component correctly triggers an event.
            const saleDetails = await this.rpc({
                model: 'report.point_of_sale.report_saledetails',
                method: 'get_sale_details',
                args: [false, false, false, [this.env.pos.pos_session.id]],
            });
            const report = renderToString(
                'SaleDetailsReport',
                Object.assign({}, saleDetails, {
                    date: new Date().toLocaleString(),
                    pos: this.env.pos,
                })
            );
            
            if (this.env.proxy.printer) {
                const printResult = await this.env.proxy.printer.print_receipt(report);
                if (!printResult.successful) {
                    await this.showPopup('ErrorPopup', {
                        title: printResult.message.title,
                        body: printResult.message.body,
                    });
                }
            }
            else {
                return await this._printWeb(report);
            }
        }
        async _printWeb(printContents) {
            try {
                console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaa", printContents);
                var html="<html>";
                html+= printContents;

                html+="</html>";

                var printWin = window.open('','','left=0,top=0,width=1,height=1,toolbar=0,scrollbars=0,status  =0');
                printWin.document.write(html);
                printWin.document.close();
                printWin.focus();
                printWin.print();
                printWin.close();
                /* 
                setTimeout(() => {
                    window.print();
                }, 2000); */
                
                //document.body.innerHTML = originalContents;
                
                return true;
            } catch (_err) {
                await this.showPopup('ErrorPopup', {
                    title: this.env._t('Printing is not supported on some browsers'),
                    body: this.env._t(
                        'Printing is not supported on some browsers due to no default printing protocol ' +
                            'is available. It is possible to print your tickets by making use of an IoT Box.'
                    ),
                });
                return false;
            }
        }

        printHtml(printContents) {
            var originalContents = document.body.innerHTML;
       
            document.body.innerHTML = printContents;
       
            window.print();
       
            document.body.innerHTML = originalContents;
       }
    }
    SaleDetailsButton.template = 'SaleDetailsButton';

    Registries.Component.add(SaleDetailsButton);

    return SaleDetailsButton;
});
