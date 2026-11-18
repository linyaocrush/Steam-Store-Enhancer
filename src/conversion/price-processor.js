  function createPriceProcessor({ countries, countryMap, getSetting, getContext, getRate, isCart }) {
    const log = diagnostics.scope('conversion.prices');
    const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const separators = [...new Set(countries.flatMap(country => [country.decimalSep, country.thousandsSep].filter(Boolean)))];
    const numberPattern = new RegExp(`\\d[\\d${separators.map(value => value === ' ' ? '\\s' : escapeRegex(value)).join('')}]*\\d|\\d`, 'g');
    const rules = [...countries].sort((a, b) => b.symbol.length - a.symbol.length ||
      Number(a.fractionDigits === 0) - Number(b.fractionDigits === 0) || a.currencyCode.localeCompare(b.currencyCode));

    function symbolRange(text, start, end, rule, relaxed) {
      if (rule.symbolPos === 'front') {
        let cursor = start;
        if (relaxed) while (cursor > 0 && /\s/.test(text[cursor - 1])) cursor--;
        const prefix = rule.symbol + (relaxed ? '' : rule.symbolGap);
        const left = cursor - prefix.length;
        if (left < 0 || text.substring(left, cursor).toUpperCase() !== prefix.toUpperCase()) return null;
        return { start: left, end };
      }
      let cursor = end;
      if (relaxed) while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
      const suffix = (relaxed ? '' : rule.symbolGap) + rule.symbol;
      const right = cursor + suffix.length;
      if (right > text.length || text.substring(cursor, right).toUpperCase() !== suffix.toUpperCase()) return null;
      return { start, end: right };
    }
    function validNumber(value, rule) {
      const found = new Set(value.replace(/\d/g, '').split('').filter(Boolean).map(char => /\s/.test(char) ? ' ' : char));
      for (const separator of found) {
        if (separator !== rule.thousandsSep && separator !== rule.decimalSep) return false;
      }
      return !(rule.fractionDigits === 0 && rule.decimalSep && found.has(rule.decimalSep));
    }
    function parseNumber(value, rule) {
      let clean = rule.thousandsSep ? value.split(rule.thousandsSep).join('') : value;
      if (rule.decimalSep && rule.decimalSep !== '.') clean = clean.replace(rule.decimalSep, '.');
      const number = parseFloat(clean);
      return Number.isNaN(number) ? null : number;
    }
    function matchRule(text, number, start, end, rule, matches, fallback) {
      const range = symbolRange(text, start, end, rule, false);
      const value = parseNumber(number, rule);
      const candidate = bounds => ({ index: bounds.start, length: bounds.end - bounds.start,
        value, info: rule, raw: text.substring(bounds.start, bounds.end) });
      if (range && validNumber(number, rule) && value !== null) {
        matches.push(candidate(range));
        return true;
      }
      if (!fallback.candidate) {
        const relaxed = symbolRange(text, start, end, rule, true);
        if (relaxed && value !== null) fallback.candidate = candidate(relaxed);
      }
      return false;
    }
    async function processTextAsync(text, countryCode, targetSymbol, before, sourceCode) {
      if (!/\d/.test(text)) return text;
      const currentRule = countries.find(country => country.code === sourceCode);
      const cart = isCart();
      const otherRules = rules.filter(country => country.code !== sourceCode &&
        (cart || (country.code !== countryCode && country.currencyCode !== countryMap.get(countryCode)?.currencyCode)));
      const matches = [];
      for (const number of text.matchAll(numberPattern)) {
        const start = number.index;
        const end = start + number[0].length;
        const fallback = { candidate: null };
        let matched = currentRule && currentRule.code !== countryCode &&
          matchRule(text, number[0], start, end, currentRule, matches, fallback);
        if (!matched) {
          for (const rule of otherRules) {
            if (matchRule(text, number[0], start, end, rule, matches, fallback)) { matched = true; break; }
          }
        }
        if (!matched && fallback.candidate) matches.push(fallback.candidate);
      }
      if (!matches.length) return text;
      const currencies = [...new Set(matches.map(match => match.info.currencyCode))];
      const rates = new Map();
      const setting = getContext().setting;
      if (setting.useCustomRate) {
        log.debug('custom-rate', '使用自定义汇率', { rate: setting.customRate });
        currencies.forEach(code => rates.set(code, setting.customRate));
      } else {
        await Promise.all(currencies.map(async code => {
          try { rates.set(code, await getRate(code)); }
          catch (error) { log.error('rate-failed', '价格所需汇率不可用', { currency: code, error }); }
        }));
      }
      let result = text;
      let convertedCount = 0;
      for (const match of matches.sort((a, b) => b.index - a.index)) {
        const rate = rates.get(match.info.currencyCode);
        if (!rate) continue;
        const converted = Number.parseFloat((match.value / rate).toFixed(2));
        const formatted = before ? `(${targetSymbol}${converted})` : `(${converted}${targetSymbol})`;
        result = result.substring(0, match.index) + match.raw + formatted + result.substring(match.index + match.length);
        convertedCount++;
      }
      log.debug('converted', '价格文本处理完成', { matched: matches.length, converted: convertedCount, currencies });
      return result;
    }
    return {
      processTextAsync,
      convertContent(text) {
        const setting = getSetting();
        return processTextAsync(text, setting.countyCode, setting.currencySymbol,
          setting.currencySymbolBeforeValue, getContext().currentCountyInfo.code);
      }
    };
  }
