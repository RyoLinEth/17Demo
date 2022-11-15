import './App.css';
import React, { useState } from 'react';
import { ethers } from 'ethers'
import contractABI from './contractabi.json'
import { CopyToClipboard } from 'react-copy-to-clipboard';

const contractAddress = "0x5b3b8a45B3E979FD338fa2923a0B708Aa29C6322";

function App() {
  /*
    自動獲取的參數
    refAccount  : 讀取網頁連結 所得到的推薦人地址
  */
  let refAccount;

  /*
    預先設定的參數
    defaultIDOAddress : 預設的IDO地址
  */
  const defaultIDOAddress = "0x60e21c1C75E60a966734B4Dd0FE1D3ac7484F00A";
  const [errorMessage, setErrorMessage] = useState(null);
  const [defaultAccount, setDefaultAccount] = useState(null)
  const [connectButtonText, setConnectButtonText] = useState('Connect Wallet')
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [father, setFather] = useState(null);
  const [ancestor, setAncestor] = useState(null);
  const [refLink, setRefLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const connectWalletHandler = async () => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(result => {
          accountChangeHandler(result[0]);
          setConnectButtonText('Wallet Connected');
        })
    } else {
      setErrorMessage('Need to install MetaMask!')
    }
  }

  //設定預設地址 以及 個人邀請連結
  const accountChangeHandler = async (newAccount) => {

    setDefaultAccount(newAccount);
    let tempReflink = `localhost:3000/invitedBy=${newAccount}`
    setRefLink(tempReflink);

    await updateEthers();
  }

  const updateEthers = async () => {
    let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(tempProvider);

    let tempSigner = tempProvider.getSigner();
    setSigner(tempSigner);

    let tempContract = new ethers.Contract(contractAddress, contractABI, tempSigner)
    setContract(tempContract);
  }

  const makePayment = async () => {
    const options = { value: ethers.utils.parseEther("0.000105") }
    console.log(refAccount);
    let result = await contract.makeIDO(refAccount, options)
    console.log(result);
  }

  const seeFather = async () => {
    let tempFather = await contract.fatherAddress(defaultAccount)
    setFather(tempFather);
    let tempAncestor = await contract.ancestorAddress(defaultAccount)
    setAncestor(tempAncestor);
  }

  const getRef = async () => {
    let link = window.location.href

    if (link.includes('invitedBy=')) {
      let start = link.indexOf('By=')
      refAccount = link.substring(start + 3, start + 45)
    } else {
      refAccount = defaultIDOAddress
    }
  }

  getRef()

  const alertCopied = () => {
    alert(`Your invitation link : ${refLink} has been copied`)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h2>Demo Only</h2>
        <button onClick={connectWalletHandler}>{connectButtonText}</button>
        <h5> Address : {defaultAccount} </h5>
        {errorMessage}

        <CopyToClipboard text={refLink} onCopy={() => setCopied(true)}>
          <button id="inviteLink" className="tf-button btn-effect" onClick={alertCopied}>
            Copy Invite Link
          </button>
        </CopyToClipboard>

        <br />
        <button onClick={makePayment} > Make Payment</button>
        <br />
        <button onClick={seeFather} > See Father</button>
        <h5>你爹  ：{father}</h5>
        <h5>你祖先：{ancestor}</h5>
      </header>
    </div>
  );
}

export default App;
