import pandas as pd
import numpy as np
from reports.report_generator import ReportGenerator
from sklearn.preprocessing import (
    OneHotEncoder,
    RobustScaler
)

class DatasetPreprocessor:

    def __init__(self, dataframe: pd.DataFrame, plan: dict):

        self.df = dataframe.copy()

        self.plan = plan

    def execute(self):

        print("\n========== EXECUTION ==========\n")

        for step in self.plan["preprocessing_steps"]:

            column = step["column"]
            action = step["action"].lower()

            print(f"{column} -> {action}")

            if "drop" in action:

                self._drop_column(column)

            elif "median" in action:

                self._median_impute(column)

            elif "mode" in action:

                self._mode_impute(column)

            elif "one-hot" in action:

                self._one_hot_encode(column)

            elif "log" in action:

                self._log_transform(column)

            elif "robust" in action:

                self._robust_scale(column)

        print("\nExecution Complete.\n")

        return self.df
    
    def _drop_column(self, column):

        if column in self.df.columns:
            self.df.drop(columns=[column], inplace=True)


    def _median_impute(self, column):

        self.df[column] = self.df[column].fillna(
        self.df[column].median()
    )


    def _mode_impute(self, column):

        self.df[column] = self.df[column].fillna(
        self.df[column].mode()[0]
    )
        
    def _one_hot_encode(self, column):

        encoder = OneHotEncoder(
            sparse_output=False,
            handle_unknown="ignore"
        )

        encoded = encoder.fit_transform(
            self.df[[column]]
        )

        encoded_df = pd.DataFrame(
            encoded,
            columns=encoder.get_feature_names_out([column]),
            index=self.df.index
        )

        self.df.drop(columns=[column], inplace=True)

        self.df = pd.concat(
            [self.df, encoded_df],
            axis=1
        )


    def _log_transform(self, column):

        self.df[column] = np.log1p(self.df[column])


    def _robust_scale(self, column):

        scaler = RobustScaler()

        self.df[[column]] = scaler.fit_transform(
            self.df[[column]]
        )
    
if __name__ == "__main__":

    import json
    import pandas as pd

    from config import (
        PROFILE_FILE,
        DATASET_FILE,
        OUTPUTS_DIR
    )

    from ai.client import AIClient

    # Load dataset
    df = pd.read_csv(DATASET_FILE)

    # Load profile
    with open(PROFILE_FILE, "r", encoding="utf-8") as f:
        profile = json.load(f)

    # Generate preprocessing plan with Gemma
    client = AIClient()
    plan = client.generate(profile)

    # Execute preprocessing
    preprocessor = DatasetPreprocessor(df, plan)
    clean_df = preprocessor.execute()
    report = ReportGenerator(profile, plan)

    report.save(
        OUTPUTS_DIR / "preprocessing_report.json"
    )
    # Save cleaned dataset
    OUTPUTS_DIR.mkdir(exist_ok=True)

    clean_df.to_csv(
        OUTPUTS_DIR / "cleaned_dataset.csv",
        index=False
    )

    print("✅ Clean dataset saved to outputs/cleaned_dataset.csv")