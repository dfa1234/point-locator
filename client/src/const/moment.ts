import * as momentLib from 'moment';
import 'moment/locale/fr';
import * as momentTzLib from 'moment-timezone';

momentLib.locale('fr');
export const moment = momentLib;

momentTzLib.locale('fr');
export const momentTz = momentTzLib;


export const momentFormats = {
  traditionalFrenchDateOnlyWithMonthInLetter:"DD MMMM YYYY"
};
