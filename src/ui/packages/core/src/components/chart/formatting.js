import ssf from 'ssf';
import {
    applyColumnUnits,
    AUTO_FORMAT_CODE,
    BUILT_IN_FORMATS,
    getAutoColumnUnit
} from "./builtInFormats";
import {formatDistanceToNow} from "date-fns";

const VALUE_FORMATTING_CONTEXT = 'value';
const AXIS_FORMATTING_CONTEXT = 'axis';

export const inferValueType = function (columnValue) {
    if (typeof columnValue === 'number') {
        return "number";
    } else if (typeof columnValue === 'boolean') {
        return "boolean";
    } else if (typeof columnValue === 'string') {
        let result = "string";
        if (columnValue && columnValue.includes('-')) {
            let testDateStr = columnValue;
            if (!columnValue.includes(':')) {
                testDateStr = columnValue + 'T00:00';
            }
            try {
                let testDate = new Date(testDateStr);
                if (testDate.toLocaleString().length > 0) {
                    let numCheck = Number.parseInt(testDate.toLocaleString().substring(0, 1));
                    if (numCheck != null && !isNaN(numCheck)) {
                        result = "date";
                    }
                }
            } catch (err) {
                //ignore
            }
        }
        return result;
    } else if (columnValue instanceof Date) {
        return "date";
    } else {
        return "string";
    }
};

/**
 * Returns format object to be used in the applyFormatting function
 * @param {string} formatString string containing an Excel-style format code, or a format name matching a built-in or custom format
 * @param {string} valueType optional - a string representing the data type within the column that will be formatted ('number', 'date', 'boolean', or 'string)
 * @returns a format object based on the formatString matching a built-in or custom format name, or a new custom format object containing an Excel-style format code
 */
export function getFormatObjectFromString(formatString, valueType = undefined) {
    let potentialFormatTag = formatString;
    let matchingFormat = [...BUILT_IN_FORMATS].find(
        (format) => format.formatTag?.toLowerCase() === potentialFormatTag?.toLowerCase()
    );
    let newFormat = {};
    if (matchingFormat) {
        return matchingFormat;
    } else {
        newFormat = {
            formatTag: 'custom',
            formatCode: potentialFormatTag
        };
        if (valueType) {
            newFormat.valueType = valueType;
        }
        return newFormat;
    }
}

export function standardizeDateString(date) {
    if (date && typeof date === 'string') {
        // Parses an individual string into a JS date object

        let dateSplit = date.split(' ');

        // If date doesn't contain timestamp, add one at midnight (avoids timezone interpretation issue)
        if (!date.includes(':')) {
            date = date + 'T00:00:00';
        }

        // Remove any character groups beyond 2 (date and time):
        if (dateSplit.length > 2) {
            date = dateSplit[0] + ' ' + dateSplit[1];
        }

        // Replace microseconds if needed:
        const re = /\.([^\s]+)/;
        date = date.replace(re, '');

        // Remove "Z" to avoid timezone interpretation issue:
        date = date.replace('Z', '');

        // Replace spaces with "T" to conform to ECMA standard:
        date = date.replace(' ', 'T');
    }

    return date;
}

/**
 * Formatting logic for formats with formatCode=AUTO_FORMAT_CODE
 * @param {*} typedValue the value to be formatted
 * @param {*} columnFormat the auto formatting description with _autoFormat settings
 * @param {*} columnUnitSummary the summary of units in the column (only applicable to numbered columns)
 * @returns formattedv value
 */
export const autoFormat = (typedValue, columnFormat, columnUnitSummary = undefined) => {
    if (columnFormat._autoFormat?.autoFormatFunction) {
        debugger
        return columnFormat._autoFormat.autoFormatFunction(typedValue, columnFormat, columnUnitSummary);
    } else if (columnFormat._autoFormat.autoFormatCode) {
        let autoFormatCode = columnFormat?._autoFormat?.autoFormatCode;
        let valueType = columnFormat.valueType;
        if ('number' === valueType) {
            let truncateUnits = columnFormat?._autoFormat?.truncateUnits;

            let unitValue = typedValue;
            let unit = '';

            if (truncateUnits && columnUnitSummary?.median !== undefined) {
                //use of median is a bit detached here. Perhaps _autoFormat.truncateUnits could instead be _autoFormat.columnUnits=k|M|B (already done for default currency)
                //this will affect the auto currency formatting since they simply rely on the median. Perhaps they should be functions instead.
                unit = getAutoColumnUnit(columnUnitSummary.median);
                unitValue = applyColumnUnits(typedValue, unit);
            }
            return ssf.format(autoFormatCode, unitValue) + unit;
        } else {
            debugger
            return ssf.format(autoFormatCode, typedValue);
        }
    } else {
        console.warn('autoFormat called without a formatCode or function');
    }
    return typedValue;
};
export const fallbackFormat = (typedValue) => {
    if (typeof typedValue === 'number') {
        return typedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    } else if (typedValue !== undefined && typedValue !== null) {
        return typedValue?.toString();
    } else {
        return '-';
    }
};
export const isAutoFormat = (format, effectiveCode) => {
    return (effectiveCode || format.formatCode)?.toLowerCase() === AUTO_FORMAT_CODE;
};

function getEffectiveFormattingCode(columnFormat, formattingContext = VALUE_FORMATTING_CONTEXT) {
    if (typeof columnFormat === 'string') {
        // This should only be used by end users, not by components.
        return columnFormat;
    } else {
        if (formattingContext === AXIS_FORMATTING_CONTEXT && columnFormat?.axisFormatCode) {
            return columnFormat.axisFormatCode;
        }
        return columnFormat?.formatCode;
    }
}

function applyFormatting(
    value,
    columnFormat = undefined,
    columnUnitSummary = undefined,
    formattingContext = VALUE_FORMATTING_CONTEXT
) {
    if (value === undefined || value === null) {
        return null;
    }

    let result = undefined;
    if (columnFormat) {
        try {
            let formattingCode = getEffectiveFormattingCode(columnFormat, formattingContext);
            let typedValue;
            try {
                if (columnFormat.valueType === 'date' && typeof value === 'string') {
                    typedValue = new Date(standardizeDateString(value));
                } else if (
                    columnFormat.valueType === 'number' &&
                    typeof value !== 'number' &&
                    !Number.isNaN(value)
                ) {
                    typedValue = Number(value);
                } else {
                    typedValue = value;
                }
            } catch (error) {
                typedValue = value;
            }
            if (isAutoFormat(columnFormat, formattingCode)) {
                try {
                    result = autoFormat(typedValue, columnFormat, columnUnitSummary);
                } catch (error) {
                    console.warn(`Unexpected error applying auto formatting. Error=${error}`);
                }
            } else {
                result = ssf.format(formattingCode, typedValue);
            }
        } catch (error) {
            console.warn(`Unexpected error applying formatting ${error}`);
        }
    }
    if (result === undefined) {
        result = fallbackFormat(value, columnUnitSummary);
    }
    return result;
}

export const formatValue = (value, columnFormat = undefined, columnUnitSummary = undefined) => {
    try {
        return applyFormatting(value, columnFormat, columnUnitSummary, VALUE_FORMATTING_CONTEXT);
    } catch (error) {
        console.warn(
            `Unexpected error calling applyFormatting(${value}, ${columnFormat}, ${VALUE_FORMATTING_CONTEXT}, ${columnUnitSummary}). Error=${error}`
        );
        return value;
    }
};

function humanFileSize(bytes, si = false, dp = 1) {
    if (bytes == null) {
        return null
    }
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}

function relative(value) {
    return formatDistanceToNow(new Date(standardizeDateString(value)), { addSuffix: true })
}

const customMappings = {
    "bytes": humanFileSize,
    "relative": relative,
}

export function fmt(value, format) {
    let customMapping = customMappings[format];
    if(customMapping != null) {
        return customMapping(value)
    }

    const valueType = inferValueType(value);
    if(valueType === 'number' && format == null) {
        format = 'auto'
    }

    if(format == null) {
        return value
    }

    let formatObj = getFormatObjectFromString(format);


    formatObj.valueType = valueType;
    return formatValue(value, formatObj);
}

