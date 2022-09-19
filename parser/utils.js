// https://stackoverflow.com/a/34749873/2744990
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}


function TransitionBuilder() {
    this.transitions = {};
    this.sourceMap = {};

    this.addTransition = function(state, transition, nextState) {
        const outSrc = `${transition.name}: function() { this.state = "${nextState.name}"; }`;

        const { name } = state;
        const transitionObj = {
            [transition.name]: function () {
                this.state = nextState.name;
            },
        };

        if (!this.transitions[name]) {
            this.transitions[name] = transitionObj;
            this.sourceMap[name] = {};
        } else {
            Object.assign(this.transitions[name], transitionObj);
        }

        if (this.sourceMap[name][transition.name]) {
            throw new BuildError(`Multiple possible transitions: transition '${transition.name}' from state '${name}'`);
        }
        this.sourceMap[name][transition.name] = outSrc;
    }
}

function unpackRuleStmt(ruleArr) {
    /**
     * Convert rule statement into an array of transitions
     */
    const builder = new TransitionBuilder();

    ruleArr.forEach((item, i) => {
        if (item.type === "state" && i !== ruleArr.length - 1) {
            const transition = ruleArr[i + 1];
            const nextState = ruleArr[i + 2];

            switch (transition.direction) {
                case "r":
                    builder.addTransition(item, transition, nextState);
                    break;
                case "l":
                    builder.addTransition(nextState, transition, item);
                    break;
                case "lr":
                    builder.addTransition(item, transition, nextState);
                    builder.addTransition(nextState, transition, item);
                    break;
                default:
                    break;
            }
        }
    });

    const initialState = ruleArr.find(r => r.initial);

    return {
        initial: initialState?.name || false,
        transitions: builder.transitions,
        sourceMap: builder.sourceMap,
    };
}

function mergeRules(rules) {
    const splitTransitions = rules.map(r => r.transitions);
    const splitSourceMap = rules.map(r => r.sourceMap);
    const transitions = splitTransitions.reduce((r,c) => mergeDeep(r, c), {});
    const sourceMap = splitSourceMap.reduce((r,c) => mergeDeep(r, c), {});

    const initial = rules.find(r => r.initial)?.initial;

    return {
        initial,
        transitions,
        sourceMap,
    }
}

module.exports = { unpackRuleStmt, mergeRules };