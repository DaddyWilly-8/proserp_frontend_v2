import dayjs from "dayjs";

//Remove commas from separated number format
export function sanitizedNumber(number){
    return typeof number === 'string' ? parseFloat(number.replace(/,/g, '')) : number;
}

export function MySQLDateTimeString(date){
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function readableDate(dateString, withTime = true) {
    const formatString = `DD MMM YYYY${withTime ? ' HH:mm' : ''}`;
    return dayjs(dateString).format(formatString);
}

export function readableTime(timeString, withSeconds = false) {
    const formatString = `HH:mm${withSeconds ? ':ss' : ''}`;
    return dayjs(timeString).format(formatString);
}

export function autocompleteTreeOptions(tree,treeLevel = -1,options = []) {
    treeLevel = treeLevel+1;
    tree.map(parent => {
        options.push({id : parent.id, name : parent.name});
        parent.children.length > 0 && autocompleteTreeOptions(parent.children,treeLevel,options);
    });
    return options;
}

// Reports whose backend has no 'all' sentinel for cost_center_ids (unlike the
// accounts/financial reports, which return an empty filters.cost_centers list
// when unfiltered) always echo back a real list — the user's entire
// accessible set when the selector was left empty. Printing every one of
// those by name (often a dozen-plus auto-generated Project cost centers) on
// the report header is exactly the clutter the selector fix addressed, just
// on the output side instead of the input side. Treating "selected list
// covers everything the user can access" the same as "nothing selected"
// mirrors how the financial reports already hide this line when unfiltered.
export function reportCostCentersToShow(selectedCostCenters, accessibleCostCenters) {
    if (!Array.isArray(selectedCostCenters) || selectedCostCenters.length === 0) {
        return [];
    }
    if (
        Array.isArray(accessibleCostCenters) &&
        selectedCostCenters.length >= accessibleCostCenters.length
    ) {
        return [];
    }
    return selectedCostCenters;
}

export function shortNumber(value){
    let shortNumber = value;

      if(Math.abs(value) > 100000){
        shortNumber = `${value / 1000}K`
      }

      if(Math.abs(value) > 1000000){
        shortNumber = `${value / 1000000}M`
      }

      if(Math.abs(value) > 1000000000){
        shortNumber = `${value / 1000000000}B`
      }
      return shortNumber;
}
