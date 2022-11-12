from collections import defaultdict
from tokenize import generate_tokens
import re

from transformers import AutoTokenizer, AutoModelForMaskedLM, pipeline

tokenizer = AutoTokenizer.from_pretrained("neulab/codebert-python")
model = AutoModelForMaskedLM.from_pretrained("neulab/codebert-python")
fill_mask = pipeline('fill-mask', model=model, tokenizer=tokenizer)

def get_best_output(outputs):
    probs = defaultdict(float)
    for output in outputs:
        probs[output["token_str"].strip()] += output["score"]
    return max(probs.items(), key=lambda x: x[1])


def autocorrect(text, line):
    lines = [x + "\n" for x in text.split("\n")]
    N = len(lines)

    tokens = list(generate_tokens(lambda L=iter(lines): next(L)))
    filtered_tokens = defaultdict(list)
    for token in tokens:
        filtered_tokens[token.start[0] - 1].append(token)
    line_lengths = [filtered_tokens[i][-1].end[1] for i in range(N)]
    cumulative_lengths = [sum(line_lengths[:i]) for i in range(N)]
    
    curr_tokens = filtered_tokens[line]
    curr_token_strings = [x.string for x in curr_tokens]
    print(" ".join(curr_token_strings).strip())

    suggestions = []
    for i in range(len(curr_tokens)):
        prev = curr_token_strings[i]
        curr_token_strings[i] = "<mask>"
        string = " ".join(curr_token_strings).strip()
        curr_token_strings[i] = prev
        outputs = fill_mask(string)
        best_output, best_prob = get_best_output(outputs)
        if best_output.strip() != prev.strip() and best_prob > 0.8:
            print("CHANGE {", prev, "} to {", best_output, "}")
            start = cumulative_lengths[curr_tokens[i].start[0] - 1] + curr_tokens[i].start[1]
            end = cumulative_lengths[curr_tokens[i].end[0] - 1] + curr_tokens[i].end[1]
            suggestions.append(((prev, start, end), best_output))

    return suggestions