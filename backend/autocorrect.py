from collections import defaultdict
from tokenize import generate_tokens

from Levenshtein import distance
from transformers import AutoTokenizer, AutoModelForMaskedLM, pipeline

python_tokenizer = AutoTokenizer.from_pretrained("neulab/codebert-python")
python_model = AutoModelForMaskedLM.from_pretrained("neulab/codebert-python")
python_fill_mask = pipeline('fill-mask', model=python_model, tokenizer=python_tokenizer)

javascript_tokenizer = AutoTokenizer.from_pretrained("neulab/codebert-javascript")
javascript_model = AutoModelForMaskedLM.from_pretrained("neulab/codebert-javascript")
javascript_fill_mask = pipeline('fill-mask', model=javascript_model, tokenizer=javascript_tokenizer)

c_tokenizer = AutoTokenizer.from_pretrained("neulab/codebert-c")
c_model = AutoModelForMaskedLM.from_pretrained("neulab/codebert-c")
c_fill_mask = pipeline('fill-mask', model=c_model, tokenizer=c_tokenizer)

cpp_tokenizer = AutoTokenizer.from_pretrained("neulab/codebert-cpp")
cpp_model = AutoModelForMaskedLM.from_pretrained("neulab/codebert-cpp")
cpp_fill_mask = pipeline('fill-mask', model=cpp_model, tokenizer=cpp_tokenizer)

java_tokenizer = AutoTokenizer.from_pretrained("neulab/codebert-java")
java_model = AutoModelForMaskedLM.from_pretrained("neulab/codebert-java")
java_fill_mask = pipeline('fill-mask', model=java_model, tokenizer=java_tokenizer)

tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
model = AutoModelForMaskedLM.from_pretrained("microsoft/codebert-base")
fill_mask = pipeline('fill-mask', model=model, tokenizer=tokenizer)


def get_fill_mask(lang):
    if lang == "python":
        return python_fill_mask
    elif lang == "javascript":
        return javascript_fill_mask
    elif lang == "c":
        return c_fill_mask
    elif lang == "cpp":
        return cpp_fill_mask
    elif lang == "java":
        return java_fill_mask
    else:
        print("Using default fill mask", lang)
        return fill_mask


def merge_outputs(outputs):
    probs = defaultdict(float)
    for output in outputs:
        probs[output["token_str"].strip()] += output["score"]
    return probs

def tokenize(lines, line):
    N = len(lines)
    tokens = list(generate_tokens(lambda L=iter(lines): next(L)))
    filtered_tokens = defaultdict(list)
    for token in tokens:
        filtered_tokens[token.start[0] - 1].append(token)
    line_lengths = [filtered_tokens[i][-1].end[1] for i in range(N)]
    cumulative_lengths = [sum(line_lengths[:i]) for i in range(N)]
    
    curr_tokens = filtered_tokens[line]
    curr_token_strings = [x.string for x in curr_tokens]
    line_offset = cumulative_lengths[line]
    
    print(" ".join(curr_token_strings).strip())
    
    return curr_tokens, curr_token_strings, line_offset


def get_best_output(prev, merged_outputs):
    merged_outputs = sorted(merged_outputs.items(), key=lambda x: -x[1])
    best_output, best_ratio = merged_outputs[0][0], merged_outputs[0][1] / merged_outputs[2][1]
    dist_outputs = {}
    for key, value in merged_outputs:
        dist = distance(prev, key)
        new_prob = value * 0.2 ** dist
        dist_outputs[key] = new_prob
    dist_outputs = sorted(dist_outputs.items(), key=lambda x: -x[1])
    new_output, new_ratio = dist_outputs[0][0], dist_outputs[0][1] / dist_outputs[2][1]
    if new_ratio > best_ratio:
        best_output = new_output
        best_ratio = new_ratio
    return best_output, best_ratio
    

def autocorrect(text, line, lang):
    fill_mask = get_fill_mask(lang)

    lines = [x + "\n" for x in text.split("\n")]
    curr_tokens, curr_token_strings, line_offset = tokenize(lines, line)

    best_suggestion = 0
    suggestions = []
    prev_lines = "".join(lines[max(0, line-2):line])
    next_lines = "".join(lines[line+1:line+3])
    for i in range(len(curr_tokens)):
        prev = curr_token_strings[i]
        if len(prev.strip()) == 0:
            continue

        curr_token_strings[i] = "<mask>"
        string = " ".join(curr_token_strings).strip()
        curr_token_strings[i] = prev

        outputs = fill_mask(prev_lines + string + next_lines)
        merged_outputs = merge_outputs(outputs)
        print(merged_outputs)
        if len(merged_outputs) < 3:
            continue

        best_output, best_ratio = get_best_output(prev, merged_outputs)
        # print(i, "\t", prev, "\t", best_output, "\t", best_ratio)
        if best_output.strip() != prev.strip() and len(best_output.strip()) > 0 and best_ratio > 5:
            print("CHANGE {", prev, "} to {", best_output, "} (", best_ratio, ")")
            start = line_offset + curr_tokens[i].start[1]
            end = line_offset + curr_tokens[i].end[1]
            suggestions.append((((prev, start, end), best_output), best_ratio))
            best_suggestion = max(best_suggestion, best_ratio)
        
    suggestions = [s[0] for s in suggestions if s[1] >= 0.5 * best_suggestion]
    return suggestions
