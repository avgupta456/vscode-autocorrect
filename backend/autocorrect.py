from collections import defaultdict

from transformers import AutoTokenizer, AutoModelForMaskedLM, pipeline

tokenizer = AutoTokenizer.from_pretrained("neulab/codebert-python")
model = AutoModelForMaskedLM.from_pretrained("neulab/codebert-python")
fill_mask = pipeline('fill-mask', model=model, tokenizer=tokenizer)

def get_best_output(outputs):
    probs = defaultdict(float)
    for output in outputs:
        probs[output["token_str"].strip()] += output["score"]
    return max(probs.items(), key=lambda x: x[1])


def autocorrect(text):
    print(text)
    return []