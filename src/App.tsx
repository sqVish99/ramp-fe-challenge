import { Fragment, useCallback, useEffect, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [accumulatedTransactions, setAccumulatedTransactions] = useState<any>([]);
  const [isFilteredByEmployee, setIsFilteredByEmployee] = useState(false);

  useEffect(() => {
    if (paginatedTransactions?.data) {
      setAccumulatedTransactions((prev: any) => [...prev, ...paginatedTransactions.data]);
    }
  }, [paginatedTransactions]);

  useEffect(() => {
    if (transactionsByEmployee) {
      setAccumulatedTransactions(transactionsByEmployee);
    }
  }, [transactionsByEmployee]);

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    setIsFilteredByEmployee(false);
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false)

    await paginatedTransactionsUtils.fetchAll()
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsFilteredByEmployee(true);
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            setAccumulatedTransactions([]);
            if (newValue === null) {
              return
            }
            newValue === EMPTY_EMPLOYEE ? await loadAllTransactions() : loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={accumulatedTransactions} />

          {accumulatedTransactions.length > 0 && !isFilteredByEmployee && paginatedTransactions?.nextPage !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
